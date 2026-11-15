import uuid
from django.db import models
from django.contrib.auth import get_user_model
from apps.languages.models import Language

User = get_user_model()

class ImportJob(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    language = models.ForeignKey(Language, on_delete=models.CASCADE, related_name='import_jobs')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    excel_file = models.FileField(upload_to='imports/excel/')
    zip_file = models.FileField(upload_to='imports/zip/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    total_records = models.IntegerField(default=0)
    processed_records = models.IntegerField(default=0)
    error_log = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Import {self.id} - {self.status}"