import uuid
from django.db import models

class Language(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    native_name = models.CharField(max_length=100)
    iso_code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True, null=True)
    writing_direction = models.CharField(max_length=3, choices=[('LTR', 'Left to Right'), ('RTL', 'Right to Left')], default='LTR')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.native_name})"

class Script(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    language = models.ForeignKey(Language, on_delete=models.CASCADE, related_name='scripts')
    name = models.CharField(max_length=50) # e.g., Hiragana, Katakana, Kanji, Latin
    is_default = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.name} - {self.language.name}"

class AlphabetCharacter(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    script = models.ForeignKey(Script, on_delete=models.CASCADE, related_name='characters')
    character = models.CharField(max_length=10)
    pronunciation = models.CharField(max_length=50)
    audio_file = models.FileField(upload_to='alphabets/audio/', null=True, blank=True)

    def __str__(self):
        return self.character