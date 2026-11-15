from rest_framework import serializers
from .models import ImportJob

class ImportJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportJob
        fields = '__all__'
        read_only_fields = ['status', 'total_records', 'processed_records', 'error_log', 'uploaded_by']