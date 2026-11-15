import os
import zipfile
from openpyxl import load_workbook
from django.core.files.base import ContentFile
from apps.vocabulary.models import Vocabulary, VocabularyMedia
from apps.languages.models import Language
from apps.imports.models import ImportJob

def start_import_process(job_id):
    job = ImportJob.objects.get(id=job_id)
    job.status = 'processing'
    job.save()

    try:
        lang = job.language
        if not lang:
            lang, _ = Language.objects.get_or_create(name='Japanese', iso_code='ja')
            job.language = lang
            job.save()

        # Pandas වෙනුවට openpyxl භාවිතය (Windows DLL ගැටලු මඟහැරීමට)
        wb = load_workbook(job.excel_file.path, data_only=True)
        ws = wb.active
        
        headers = [str(cell.value).strip() if cell.value else '' for cell in ws[1]]
        success_count = 0

        with zipfile.ZipFile(job.media_zip.path, 'r') as zf:
            zip_map = {os.path.basename(f): f for f in zf.namelist() if not f.endswith('/')}

            for row in ws.iter_rows(min_row=2, values_only=True):
                row_data = dict(zip(headers, row))
                
                word_text = str(row_data.get('word', '')).strip()
                if not word_text or word_text == 'None':
                    continue
                
                vocab = Vocabulary.objects.filter(language=lang, word=word_text).first()
                if not vocab:
                    vocab = Vocabulary(language=lang, word=word_text)
                
                vocab.reading = str(row_data.get('reading', '')).strip()
                if vocab.reading == 'None': vocab.reading = ''
                
                wt = str(row_data.get('word_type', 'other')).strip().lower()
                vocab.word_type = wt if wt != 'none' else 'other'
                
                ex = str(row_data.get('example_sentence', '')).strip()
                vocab.example_sentence = ex if ex != 'none' else ''
                
                vocab.save()

                media_filename = str(row_data.get('media_file', '')).strip()
                if media_filename and media_filename != 'None':
                    base_media_name = os.path.basename(media_filename)
                    if base_media_name in zip_map:
                        media_data = zf.read(zip_map[base_media_name])
                        VocabularyMedia.objects.filter(vocabulary=vocab).delete()
                        media_obj = VocabularyMedia(vocabulary=vocab, media_type='image')
                        media_obj.file.save(base_media_name, ContentFile(media_data), save=True)
                
                success_count += 1

        job.status = 'completed'
        job.processed_records = success_count
        job.save()

    except Exception as e:
        job.status = 'failed'
        job.error_message = str(e)
        job.save()