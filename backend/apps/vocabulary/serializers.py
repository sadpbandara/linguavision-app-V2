from rest_framework import serializers
from .models import Vocabulary, VocabularyCategory, VocabularyMedia, VocabularyAudio, VocabularyImage


class VocabularyCategorySerializer(serializers.ModelSerializer):
    word_count = serializers.IntegerField(source='vocabularies.count', read_only=True)

    class Meta:
        model = VocabularyCategory
        fields = ['id', 'language', 'lesson_number', 'name', 'book_level', 'description', 'word_count']


class VocabularyMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = VocabularyMedia
        fields = ['id', 'file', 'media_type']


class VocabularyAudioSerializer(serializers.ModelSerializer):
    class Meta:
        model = VocabularyAudio
        fields = ['id', 'audio_file']


class VocabularySerializer(serializers.ModelSerializer):
    media = VocabularyMediaSerializer(many=True, read_only=True)
    audio = VocabularyAudioSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    lesson_number = serializers.IntegerField(source='category.lesson_number', read_only=True)

    class Meta:
        model = Vocabulary
        fields = [
            'id', 'language', 'category', 'category_name', 'lesson_number',
            'word', 'reading', 'romaji', 'meaning', 'core_meaning',
            'word_type', 'example_sentence', 'media', 'audio', 'created_at'
        ]