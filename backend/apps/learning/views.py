from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import UserWordProgress
from apps.vocabulary.models import Vocabulary
from .services import calculate_sm2

class ReviewWordAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, vocab_id):
        quality = request.data.get('quality')
        
        if quality is None or not (0 <= int(quality) <= 5):
            return Response({"error": "Quality must be between 0 and 5"}, status=status.HTTP_400_BAD_REQUEST)
            
        quality = int(quality)
        vocabulary = get_object_or_404(Vocabulary, id=vocab_id)
        
        # දැනටමත් Progress record එකක් ඇත්නම් එය ගනී, නැත්නම් අලුතින් සාදයි
        progress, created = UserWordProgress.objects.get_or_create(
            user=request.user,
            vocabulary=vocabulary
        )
        
        # SM-2 ගණනය කිරීම
        rep, intv, ef, next_rev = calculate_sm2(
            quality, progress.repetitions, progress.interval, progress.ease_factor
        )
        
        # දත්ත යාවත්කාලීන කිරීම
        progress.repetitions = rep
        progress.interval = intv
        progress.ease_factor = ef
        progress.last_reviewed = timezone.now()
        progress.next_review_date = next_rev
        
        # Status එක තීරණය කිරීම
        if progress.interval > 21:
            progress.status = 'Mastered'
        elif progress.interval > 7:
            progress.status = 'Review'
        else:
            progress.status = 'Learning'
            
        progress.save()
        
        return Response({
            "message": "Progress updated successfully",
            "next_review_date": progress.next_review_date,
            "status": progress.status,
            "interval_days": progress.interval
        })

from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Exam, ExamAttempt, Question, Choice
from .serializers import ExamSerializer, ExamAttemptSerializer
import json

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = ExamSerializer
    permission_classes = [permissions.IsAuthenticated]

class ExamAttemptViewSet(viewsets.ModelViewSet):
    queryset = ExamAttempt.objects.all()
    serializer_class = ExamAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user).order_by('-created_at')
        
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# අලුතින් එක් කළ React එකෙන් ප්‍රශ්න සහ පිළිතුරු ඇතුළත් කිරීමේ API එක
class QuestionManagerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, exam_id):
        try:
            exam = Exam.objects.get(id=exam_id)
            question = Question.objects.create(
                exam=exam,
                section=request.data.get('section', 'vocab'),
                text=request.data.get('text', ''),
                image=request.FILES.get('image'),
                audio=request.FILES.get('audio')
            )
            
            # JSON හරහා එන පිළිතුරු (Choices) 4 Database එකට සේව් කිරීම
            choices = json.loads(request.data.get('choices', '[]'))
            for c in choices:
                Choice.objects.create(
                    question=question, 
                    text=c.get('text', ''), 
                    is_correct=c.get('is_correct', False)
                )
            return Response({"message": "Question added successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
    def delete(self, request, exam_id, question_id):
        Question.objects.filter(id=question_id, exam_id=exam_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)