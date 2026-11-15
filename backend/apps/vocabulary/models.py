import uuid
from django.db import models
from django.utils import timezone
from apps.languages.models import Language


class VocabularyCategory(models.Model):
    """
    පාඩම් (Lessons / Units) ගබඩා කරන Model එක.
    උදා: Japanese -> Irodori Lesson 1 .. 18
         English  -> IELTS Band 7 Vocabulary
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    language = models.ForeignKey(
        Language,
        on_delete=models.CASCADE,
        related_name='lessons',
        null=True,
        blank=True
    )
    lesson_number = models.PositiveIntegerField(default=1, help_text="e.g., 1 to 18 for Irodori")
    name = models.CharField(max_length=150)  # e.g., "Lesson 01 - කෑම බීම (食事)"
    book_level = models.CharField(
        max_length=50,
        blank=True,
        default='Irodori Starter (A1)',
        help_text="e.g., Irodori Intro, Elementary 1, Elementary 2, IELTS"
    )
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['lesson_number', 'id']

    def __str__(self):
        return f"Lesson {self.lesson_number}: {self.name}"

    
class Vocabulary(models.Model):
    WORD_TYPES = [
        ('noun', 'Noun (名詞)'),
        ('verb', 'Verb (動詞)'),
        ('i-adjective', 'I-Adjective (い形容詞)'),
        ('na-adjective', 'Na-Adjective (な形容詞)'),
        ('adverb', 'Adverb (副詞)'),
        ('expression', 'Expression (表現)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    language = models.ForeignKey(
        Language,
        on_delete=models.CASCADE,
        related_name='vocabularies',
        null=True,
        blank=True
    )
    category = models.ForeignKey(
        VocabularyCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vocabularies'
    )
    word = models.CharField(max_length=255)
    reading = models.CharField(max_length=255, blank=True, null=True)
    romaji = models.CharField(max_length=255, blank=True, null=True)
    meaning = models.CharField(max_length=255, blank=True, null=True)
    word_type = models.CharField(max_length=50, choices=WORD_TYPES, default='noun')
    example_sentence = models.TextField(blank=True, null=True)

    # NeuroRecall Semantic Metadata
    core_meaning = models.CharField(max_length=255, blank=True, default='')
    semantic_category = models.CharField(max_length=100, blank=True, default='General')
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def save(self, *args, **kwargs):
        # Language එකක් ලබා දී නොමැති නම් ස්වයංක්‍රීයව Japanese ලබා දීම
        if not self.language_id:
            lang, _ = Language.objects.get_or_create(iso_code='ja', defaults={'name': 'Japanese'})
            self.language = lang
        # meaning සහ core_meaning දෙකම සමගාමීව තබා ගැනීම
        if self.meaning and not self.core_meaning:
            self.core_meaning = self.meaning
        elif self.core_meaning and not self.meaning:
            self.meaning = self.core_meaning
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.word} ({self.reading or self.romaji or ''})"


class VocabularyMedia(models.Model):
    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('animation', 'Animation'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vocabulary = models.ForeignKey(Vocabulary, on_delete=models.CASCADE, related_name='media')
    file = models.FileField(upload_to='vocabulary/media/')
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPES, default='image')
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.vocabulary.word} - {self.media_type}"


class VocabularyAudio(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vocabulary = models.ForeignKey(Vocabulary, on_delete=models.CASCADE, related_name='audio')
    audio_file = models.FileField(upload_to='vocabulary/audio/')
    reading_variant = models.CharField(max_length=255, blank=True, default='')
    pitch_accent = models.CharField(max_length=50, blank=True, default='')
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Audio for {self.vocabulary.word}"


class VocabularyImage(models.Model):
    IMAGE_CLASSIFICATION_CHOICES = [
        ('EXACT', 'A. Exact Semantic Match'),
        ('CONTEXTUAL', 'B. Valid Contextual Representation'),
        ('SEMANTIC_DISTRACTOR', 'C. Related Semantic Distractor'),
        ('VISUAL_CONFUSER', 'D. Visually Confusing Distractor'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vocabulary = models.ForeignKey(Vocabulary, on_delete=models.CASCADE, related_name='neuro_images')
    image = models.ImageField(upload_to='neurorecall/images/')
    classification = models.CharField(max_length=30, choices=IMAGE_CLASSIFICATION_CHOICES, default='EXACT')
    concept_label = models.CharField(max_length=255, blank=True, default='')
    explanation = models.TextField(blank=True, default='')
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    @property
    def is_correct_answer(self) -> bool:
        return self.classification in ('EXACT', 'CONTEXTUAL')


class SemanticRelation(models.Model):
    RELATION_TYPES = [
        ('SIBLING', 'Functional Sibling'),
        ('ANTONYM', 'Opposite Concept'),
        ('LOOKALIKE', 'Visually Similar'),
    ]
    source_word = models.ForeignKey(Vocabulary, on_delete=models.CASCADE, related_name='related_from')
    target_word = models.ForeignKey(Vocabulary, on_delete=models.CASCADE, related_name='related_to')
    relation_type = models.CharField(max_length=20, choices=RELATION_TYPES, default='SIBLING')
    distinction_note = models.TextField(blank=True, default='')

    class Meta:
        unique_together = ('source_word', 'target_word')