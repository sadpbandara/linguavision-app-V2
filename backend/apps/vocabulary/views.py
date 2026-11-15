from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.languages.models import Language
from .models import Vocabulary, VocabularyMedia, VocabularyAudio, VocabularyCategory
from .serializers import VocabularySerializer, VocabularyCategorySerializer


def get_japanese_language():
    lang = Language.objects.filter(iso_code='ja').first() or Language.objects.filter(name__icontains='Japan').first()
    if not lang:
        lang = Language.objects.first()
    if not lang:
        lang = Language.objects.create(name='Japanese', iso_code='ja')
    return lang


class VocabularyCategoryViewSet(viewsets.ModelViewSet):
    """
    Admin ට පාඩම් (Lessons) Create, Edit, Delete කිරීමට.
    """
    queryset = VocabularyCategory.objects.all().order_by('lesson_number', 'name')
    serializer_class = VocabularyCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        lang_id = self.request.query_params.get('language')
        if lang_id:
            qs = qs.filter(language_id=lang_id)
        return qs

    @action(detail=False, methods=['post'])
    def seed_irodori(self, request):
        ja_lang = get_japanese_language()
        book_level = request.data.get('book_level', 'Irodori Elementary 1 (A2)')

        created_count = 0
        for num in range(1, 19):
            lesson_title = f"Irodori Lesson {num:02d}"
            obj, created = VocabularyCategory.objects.get_or_create(
                name=lesson_title,
                defaults={
                    'language': ja_lang,
                    'lesson_number': num,
                    'book_level': book_level,
                    'description': f'JFT-Basic & Irodori Lesson {num:02d} Vocabulary'
                }
            )
            if created:
                created_count += 1

        return Response(
            {"message": f"Irodori පාඩම් {created_count}ක් සාර්ථකව සාදන ලදී!"},
            status=status.HTTP_201_CREATED
        )


class VocabularyViewSet(viewsets.ModelViewSet):
    queryset = Vocabulary.objects.prefetch_related('media', 'audio').select_related('category').all()
    serializer_class = VocabularySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        category_id = self.request.query_params.get('category')
        word_type = self.request.query_params.get('word_type')

        if category_id and category_id != 'all':
            qs = qs.filter(category_id=category_id)
        if word_type and word_type != 'all':
            qs = qs.filter(word_type=word_type)
        return qs

    def create(self, request, *args, **kwargs):
        data = request.data
        ja_lang = get_japanese_language()

        category_id = data.get('category')
        category = None
        if category_id and str(category_id) not in ('', 'all', 'null', 'undefined'):
            category = VocabularyCategory.objects.filter(id=category_id).first()

        vocab = Vocabulary.objects.create(
            language=ja_lang,
            category=category,
            word=data.get('word', '').strip(),
            reading=data.get('reading', '').strip(),
            romaji=data.get('romaji', '').strip(),
            meaning=data.get('meaning', '').strip(),
            core_meaning=data.get('meaning', '').strip(),
            word_type=data.get('word_type', 'noun'),
            example_sentence=data.get('example_sentence', '').strip(),
        )

        if request.FILES.get('image'):
            VocabularyMedia.objects.create(
                vocabulary=vocab,
                file=request.FILES['image'],
                media_type='image'
            )

        if request.FILES.get('audio'):
            VocabularyAudio.objects.create(
                vocabulary=vocab,
                audio_file=request.FILES['audio']
            )

        serializer = self.get_serializer(vocab)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """
        ඇතුළත් කළ වචනයක විස්තර, පාඩම, හෝ ඡායාරූපය පසුව වෙනස් කිරීම (Edit Word & Replace Image).
        """
        vocab = self.get_object()
        data = request.data

        category_id = data.get('category')
        if category_id is not None:
            if str(category_id) in ('', 'all', 'null', 'undefined'):
                vocab.category = None
            else:
                vocab.category = VocabularyCategory.objects.filter(id=category_id).first()

        if 'word' in data:
            vocab.word = data.get('word', '').strip()
        if 'reading' in data:
            vocab.reading = data.get('reading', '').strip()
        if 'romaji' in data:
            vocab.romaji = data.get('romaji', '').strip()
        if 'meaning' in data:
            vocab.meaning = data.get('meaning', '').strip()
            vocab.core_meaning = data.get('meaning', '').strip()
        if 'word_type' in data:
            vocab.word_type = data.get('word_type', vocab.word_type)
        if 'example_sentence' in data:
            vocab.example_sentence = data.get('example_sentence', '').strip()

        vocab.save()

        # අලුත් පින්තූරයක් එවා ඇත්නම් පැරණි පින්තූරය ඉවත් කර අලුත් එක දැමීම
        if request.FILES.get('image'):
            vocab.media.filter(media_type='image').delete()
            VocabularyMedia.objects.create(
                vocabulary=vocab,
                file=request.FILES['image'],
                media_type='image'
            )

        # අලුත් හඬ ගොනුවක් එවා ඇත්නම් පැරණි එක ඉවත් කර අලුත් එක දැමීම
        if request.FILES.get('audio'):
            vocab.audio.all().delete()
            VocabularyAudio.objects.create(
                vocabulary=vocab,
                audio_file=request.FILES['audio']
            )

        serializer = self.get_serializer(vocab)
        return Response(serializer.data, status=status.HTTP_200_OK)