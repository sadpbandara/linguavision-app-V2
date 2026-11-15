from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .neuro_views import NeuroVocabStudioAPIView, NeuroImageManagerAPIView

# සියලුම Views මෙහි නිවැරදිව Import කර ඇත
from .views import ReviewWordAPIView, ExamViewSet, ExamAttemptViewSet, QuestionManagerView

# ViewSets සඳහා Router එක සැකසීම
router = DefaultRouter()
router.register(r'exams', ExamViewSet, basename='exam')
router.register(r'attempts', ExamAttemptViewSet, basename='attempt')

urlpatterns = [
    # වචන රිවිව් කිරීමේ (Flashcards) API එක
    path('review/<uuid:word_id>/', ReviewWordAPIView.as_view(), name='review-word'),
    
    # React එකෙන් අලුත් විභාග ප්‍රශ්න ඇතුළත් කිරීමට සහ මැකීමට අවශ්‍ය API (APIViews)
    path('exams/<int:exam_id>/questions/', QuestionManagerView.as_view(), name='manage-questions'),
    path('exams/<int:exam_id>/questions/<int:question_id>/', QuestionManagerView.as_view(), name='delete-question'),
    
    # Router එක හරහා යන අනෙකුත් සියලුම URLs (exams සහ attempts)
    path('', include(router.urls)),

    path('neuro/vocab/', NeuroVocabStudioAPIView.as_view(), name='neuro-vocab-studio'),
    path('neuro/vocab/<uuid:vocab_id>/images/', NeuroImageManagerAPIView.as_view(), name='neuro-add-images'),
    path('neuro/vocab/<uuid:vocab_id>/images/<uuid:image_id>/', NeuroImageManagerAPIView.as_view(), name='neuro-delete-image'),
]