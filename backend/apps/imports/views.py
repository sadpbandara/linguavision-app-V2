import io
import zipfile
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from openpyxl import Workbook
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from .models import ImportJob
from .serializers import ImportJobSerializer
from .services import start_import_process

class ImportJobViewSet(viewsets.ModelViewSet):
    queryset = ImportJob.objects.all().order_by('-created_at')
    serializer_class = ImportJobSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        # 1. Job එක Database එකේ Save කිරීම
        job = serializer.save(uploaded_by=self.request.user)
        
        # 2. Background Process එක ආරම්භ කිරීම
        start_import_process(job.id)

@api_view(['GET'])
@permission_classes([AllowAny])
def download_excel_template(request):
    """Excel Template එක ජනනය කර බාගත කිරීමට ලබා දීම"""
    wb = Workbook()
    ws = wb.active
    ws.title = "Vocabulary"
    
    # Headers
    headers = ['word', 'reading', 'word_type', 'category', 'level', 'media_file', 'audio_file', 'example_sentence']
    ws.append(headers)
    
    # Sample Row
    ws.append(['りんご', 'ringo', 'noun', 'Food', 'A1', 'apple.jpg', 'apple.mp3', 'りんごをたべます。'])
    
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename="linguavision_template.xlsx"'
    wb.save(response)
    return response

@api_view(['GET'])
@permission_classes([AllowAny])
def download_zip_template(request):
    """ZIP Folder ආකෘතිය ජනනය කර බාගත කිරීමට ලබා දීම"""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w') as zf:
        # හිස් ගොනු (Folders) සෑදීම
        zf.writestr('images/', '')
        zf.writestr('animations/', '')
        zf.writestr('audio/', '')
        # උපදෙස් ඇතුළත් Text ගොනුවක් සෑදීම
        readme_content = "Linguavision Bulk Import Guide\n\n1. Place static images (.jpg, .png) in the 'images' folder.\n2. Place GIFs in the 'animations' folder.\n3. Place pronunciation audio (.mp3) in the 'audio' folder.\n4. Make sure filenames match EXACTLY with the Excel sheet."
        zf.writestr('README.txt', readme_content)
    
    response = HttpResponse(buffer.getvalue(), content_type='application/zip')
    response['Content-Disposition'] = 'attachment; filename="media_folders_template.zip"'
    return response