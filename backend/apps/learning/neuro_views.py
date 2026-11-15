from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404

from apps.vocabulary.models import Vocabulary, VocabularyImage, VocabularyAudio
from apps.languages.models import Language


class NeuroVocabStudioAPIView(APIView):
    """
    Admin Studio API:
    - GET: සියලුම වචන සහ ඒවාට අදාළ NeuroRecall පින්තූර (Class A, B, C, D) ලබා ගැනීම.
    - POST: අලුත් වචනයක් සෑදීම හෝ යාවත්කාලීන කිරීම.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        vocab_qs = Vocabulary.objects.prefetch_related('neuro_images', 'media', 'audio').all()
        data = []

        for v in vocab_qs:
            neuro_imgs = [
                {
                    "id": str(img.id),
                    "image_url": request.build_absolute_uri(img.image.url) if img.image else "",
                    "classification": img.classification,
                    "is_correct": img.is_correct_answer,
                    "concept_label": img.concept_label,
                    "explanation": img.explanation,
                    "is_approved": img.is_approved,
                }
                for img in v.neuro_images.all()
            ]

            correct_count = sum(1 for i in neuro_imgs if i["is_correct"])
            distractor_count = sum(1 for i in neuro_imgs if not i["is_correct"])

            data.append({
                "id": str(v.id),
                "word": v.word,
                "reading": v.reading or "",
                "romaji": v.romaji or "",
                "word_type": v.word_type,
                "core_meaning": v.core_meaning or "",
                "semantic_category": v.semantic_category or "General",
                "example_sentence": v.example_sentence or "",
                "neuro_images": neuro_imgs,
                "correct_image_count": correct_count,
                "distractor_image_count": distractor_count,
                "is_game_ready": correct_count >= 2 and distractor_count >= 2,
            })

        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        # Default භාෂාව ලබා ගැනීම හෝ Japanese සෑදීම
        lang_id = request.data.get("language")
        if lang_id:
            language = get_object_or_404(Language, id=lang_id)
        else:
            language = Language.objects.first()
            if not language:
                language = Language.objects.create(name="Japanese", iso_code='ja')

        vocab = Vocabulary.objects.create(
            language=language,
            word=request.data.get("word", "").strip(),
            reading=request.data.get("reading", "").strip(),
            romaji=request.data.get("romaji", "").strip(),
            word_type=request.data.get("word_type", "noun"),
            core_meaning=request.data.get("core_meaning", "").strip(),
            semantic_category=request.data.get("semantic_category", "General").strip(),
            example_sentence=request.data.get("example_sentence", "").strip(),
        )

        if request.FILES.get("audio_file"):
            VocabularyAudio.objects.create(
                vocabulary=vocab,
                audio_file=request.FILES["audio_file"]
            )

        return Response({"id": str(vocab.id), "message": "Vocabulary created successfully"}, status=status.HTTP_201_CREATED)


class NeuroImageManagerAPIView(APIView):
    """
    Admin ට එක් වචනයක් සඳහා පින්තූර එකක් හෝ කිහිපයක් (Exact, Contextual, Distractor)
    එකවර Upload කිරීමට සහ මැකීමට අවශ්‍ය API එක.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, vocab_id):
        vocab = get_object_or_404(Vocabulary, id=vocab_id)
        classification = request.data.get("classification", "EXACT")
        concept_label = request.data.get("concept_label", "").strip()
        explanation = request.data.get("explanation", "").strip()

        files = request.FILES.getlist("images")
        if not files and request.FILES.get("image"):
            files = [request.FILES.get("image")]

        if not files:
            return Response({"error": "No image files provided."}, status=status.HTTP_400_BAD_REQUEST)

        created_images = []
        for f in files:
            img_obj = VocabularyImage.objects.create(
                vocabulary=vocab,
                image=f,
                classification=classification,
                concept_label=concept_label or vocab.core_meaning,
                explanation=explanation,
                is_approved=True,
            )
            created_images.append({
                "id": str(img_obj.id),
                "image_url": request.build_absolute_uri(img_obj.image.url),
                "classification": img_obj.classification,
                "concept_label": img_obj.concept_label,
                "explanation": img_obj.explanation,
            })

        return Response(
            {"message": f"{len(created_images)} image(s) added.", "images": created_images},
            status=status.HTTP_201_CREATED
        )

    def delete(self, request, vocab_id, image_id):
        img = get_object_or_404(VocabularyImage, id=image_id, vocabulary_id=vocab_id)
        img.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)