import uuid
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.vocabulary.models import Vocabulary

User = get_user_model()

class UserWordProgress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='word_progress')
    vocabulary = models.ForeignKey(Vocabulary, on_delete=models.CASCADE)
    
    status = models.CharField(max_length=20, default='New') # New, Learning, Review, Mastered
    
    # SM-2 Algorithm සඳහා අවශ්‍ය විචල්‍යයන් (Parameters)
    repetitions = models.IntegerField(default=0)
    interval = models.IntegerField(default=0)
    ease_factor = models.FloatField(default=2.5)
    
    last_reviewed = models.DateTimeField(null=True, blank=True)
    next_review_date = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('user', 'vocabulary') # එක් පරිශීලකයෙකුට එක් වචනයක් සඳහා ඇත්තේ එක් වාර්තාවක් පමණි

    def __str__(self):
        return f"{self.user.email} - {self.vocabulary.word} ({self.status})"

from django.conf import settings

class Exam(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    time_limit_minutes = models.IntegerField(default=60)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Question(models.Model):
    SECTIONS = [
        ('vocab', 'Script & Vocabulary'),
        ('conversation', 'Conversation & Expression'),
        ('listening', 'Listening Comprehension'),
        ('reading', 'Reading Comprehension'),
    ]
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='questions')
    section = models.CharField(max_length=20, choices=SECTIONS)
    text = models.TextField()
    image = models.FileField(upload_to='exams/images/', blank=True, null=True)
    audio = models.FileField(upload_to='exams/audio/', blank=True, null=True)

    def __str__(self):
        return f"{self.section} - {self.text[:30]}"

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text

class ExamAttempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    score = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.vocabulary.models import Vocabulary


class UserVocabularyMemory(models.Model):
    """
    Tracks individual cognitive memory state, stability, difficulty level,
    and confidence calibration for each word per user.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='neuro_memories')
    vocabulary = models.ForeignKey(Vocabulary, on_delete=models.CASCADE, related_name='user_memories')
    
    # Cognitive Difficulty Level (1 = Intro, 2 = Recognition, 3 = Semantic, 4 = Advanced, 5 = Mastery)
    cognitive_level = models.IntegerField(default=1)
    mastery_score = models.FloatField(default=0.0)  # 0.0 to 100.0
    
    # Spaced Repetition parameters
    stability_days = models.FloatField(default=0.0)
    interval_minutes = models.IntegerField(default=0)
    first_exposed_at = models.DateTimeField(auto_now_add=True)
    last_reviewed_at = models.DateTimeField(null=True, blank=True)
    next_review_at = models.DateTimeField(default=timezone.now)
    
    # Performance counters
    total_attempts = models.IntegerField(default=0)
    perfect_attempts = models.IntegerField(default=0)
    partial_attempts = models.IntegerField(default=0)
    failed_attempts = models.IntegerField(default=0)
    high_confidence_misconceptions = models.IntegerField(default=0)
    avg_response_time_ms = models.IntegerField(default=0)
    
    # Anti-memorization: stores IDs of recently shown images so we rotate visuals
    recent_image_ids = models.JSONField(default=list, blank=True)
    # Stores IDs of distractor images or words that confused this user
    confusion_history = models.JSONField(default=list, blank=True)

    class Meta:
        unique_together = ('user', 'vocabulary')

    def __str__(self):
        return f"{self.user} - {self.vocabulary.word} (Lvl {self.cognitive_level})"


class NeuroGameRound(models.Model):
    GAME_MODES = [
        ('MODE_A', 'Mode A: Visual Recognition'),
        ('MODE_B', 'Mode B: Semantic Discrimination'),
        ('MODE_C', 'Mode C: Reverse Recall'),
        ('MODE_D', 'Mode D: Audio-to-Visual Recall'),
        ('MODE_E', 'Mode E: Delayed Recall'),
        ('MODE_F', 'Mode F: Mixed Vocabulary Challenge'),
    ]
    CONFIDENCE_CHOICES = [
        ('LOW', 'Low Confidence'),
        ('MEDIUM', 'Medium Confidence'),
        ('HIGH', 'High Confidence'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='neuro_rounds')
    vocabulary = models.ForeignKey(Vocabulary, on_delete=models.CASCADE)
    game_mode = models.CharField(max_length=15, choices=GAME_MODES, default='MODE_A')
    difficulty_level = models.IntegerField(default=1)

    # Set of presented image IDs and ground-truth correct image IDs
    presented_options = models.JSONField(default=list)  # List of dicts: {id, url, is_correct, classification, label, explanation}
    correct_image_ids = models.JSONField(default=list)
    
    # User submission & evaluation
    selected_image_ids = models.JSONField(default=list, blank=True)
    confidence = models.CharField(max_length=10, choices=CONFIDENCE_CHOICES, blank=True, null=True)
    
    precision = models.FloatField(default=0.0)
    recall = models.FloatField(default=0.0)
    f1_score = models.FloatField(default=0.0)
    response_time_ms = models.IntegerField(default=0)
    xp_earned = models.IntegerField(default=0)
    
    is_submitted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)