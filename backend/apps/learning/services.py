from datetime import timedelta
from django.utils import timezone

def calculate_sm2(quality, repetitions, interval, ease_factor):
    """
    SuperMemo-2 (SM-2) ඇල්ගොරිතමය.
    quality: 0 සිට 5 දක්වා අගයක් (0 = කිසිවක් මතක නැත, 5 = ඉතා හොඳින් මතකයි)
    """
    if quality >= 3:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = int(interval * ease_factor)
        
        repetitions += 1
        ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    else:
        # පිළිතුර වැරදි නම් (quality < 3)
        repetitions = 0
        interval = 1
    
    # ease_factor එක 1.3 ට වඩා අඩු වීමට ඉඩ නොදෙයි
    if ease_factor < 1.3:
        ease_factor = 1.3
        
    next_review_date = timezone.now() + timedelta(days=interval)
    
    return repetitions, interval, ease_factor, next_review_date