from rest_framework import serializers
from .models import Language, Script, AlphabetCharacter

class AlphabetCharacterSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlphabetCharacter
        fields = '__all__'

class ScriptSerializer(serializers.ModelSerializer):
    characters = AlphabetCharacterSerializer(many=True, read_only=True)

    class Meta:
        model = Script
        fields = ['id', 'name', 'is_default', 'characters']

class LanguageSerializer(serializers.ModelSerializer):
    scripts = ScriptSerializer(many=True, read_only=True)

    class Meta:
        model = Language
        fields = ['id', 'name', 'native_name', 'iso_code', 'description', 'writing_direction', 'is_active', 'scripts']