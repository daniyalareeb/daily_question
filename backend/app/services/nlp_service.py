# NLP service for keyword extraction and text analysis
import re
import nltk
from collections import Counter
from typing import List, Dict
import asyncio

try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

try:
    nltk.data.find('taggers/averaged_perceptron_tagger')
except LookupError:
    nltk.download('averaged_perceptron_tagger')

from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.tag import pos_tag
SYNONYM_GROUPS = {
    "happiness": ["happy", "joyful", "cheerful", "pleased", "content", "satisfied", "delighted", "elated", "blissful"],
    "sadness": ["sad", "depressed", "down", "unhappy", "miserable", "gloomy", "melancholy", "sorrowful", "dejected"],
    "stress": ["stressed", "anxious", "worried", "tense", "overwhelmed", "pressured", "strained", "frazzled"],
    "excitement": ["excited", "thrilled", "enthusiastic", "eager", "pumped", "energized", "motivated", "inspired"],
    "frustration": ["frustrated", "annoyed", "irritated", "aggravated", "bothered", "upset", "disappointed"],
    "confidence": ["confident", "assured", "certain", "secure", "self-assured", "bold", "brave", "courageous"],
    "learning": ["learning", "studying", "understanding", "grasping", "comprehending", "absorbing", "picking up"],
    "progress": ["progress", "improvement", "advancement", "development", "growth", "enhancement", "betterment"],
    "money": ["money", "finances", "financial", "cash", "income", "budget", "savings", "earnings", "revenue"],
    "friendship": ["friends", "friendship", "relationships", "social", "companionship", "bonding", "connection"],
    "technology": ["technology", "tech", "digital", "computer", "software", "ai", "artificial intelligence", "machine"],
    "education": ["education", "course", "study", "academic", "school", "university", "college", "learning"],
    "health": ["health", "wellness", "fitness", "physical", "mental", "emotional", "wellbeing", "vitality"],
    "work": ["work", "job", "career", "employment", "professional", "business", "occupation", "vocation"],
    "family": ["family", "parents", "siblings", "relatives", "home", "household", "domestic", "personal"]
}

STOP_WORDS = set(stopwords.words('english'))
STOP_WORDS.update(['feel', 'feeling', 'think', 'thought', 'like', 'get', 'got', 'going', 'really', 'very', 'quite'])

def extract_keywords_from_text(text: str) -> List[str]:
    if not text or not text.strip():
        return []
    
    text = ' '.join(text.strip().split())
    text = text.lower()
    tokens = word_tokenize(text)
    
    filtered_tokens = [
        token for token in tokens 
        if token.isalpha() and token not in STOP_WORDS and len(token) > 2
    ]
    
    pos_tags = pos_tag(filtered_tokens)
    meaningful_words = [
        word for word, pos in pos_tags 
        if pos.startswith(('NN', 'JJ', 'VB'))
    ]
    
    grouped_keywords = []
    for word in meaningful_words:
        found_group = False
        for group_name, synonyms in SYNONYM_GROUPS.items():
            if word in synonyms:
                grouped_keywords.append(group_name)
                found_group = True
                break
        if not found_group:
            grouped_keywords.append(word)
    
    keyword_counts = Counter(grouped_keywords)
    return [keyword for keyword, count in keyword_counts.most_common(5)]

async def extract_keywords_from_response(text: str) -> List[str]:
    return await asyncio.get_event_loop().run_in_executor(
        None, extract_keywords_from_text, text
    )

def aggregate_keywords_across_responses(responses: List[Dict], question_id: str = None) -> Dict[str, int]:
    # Use existing keywords or extract from text
    keyword_counter = Counter()
    
    for response in responses:
        for answer in response.get("answers", []):
            if question_id and answer.get("questionId") != question_id:
                continue
            
            # First try to use pre-extracted keywords
            keywords = answer.get("keywords", [])
            
            # If no keywords exist, extract them from text
            if not keywords and answer.get("text"):
                try:
                    keywords = extract_keywords_from_text(answer.get("text", ""))
                except Exception:
                    # If extraction fails, continue without keywords
                    keywords = []
            
            keyword_counter.update(keywords)
    
    return dict(keyword_counter)

def get_trend_data(responses: List[Dict], keyword: str, question_id: str = None) -> List[Dict]:
    trend_data = []
    
    for response in responses:
        date = response.get("date")
        keyword_count = 0
        
        for answer in response.get("answers", []):
            if question_id and answer.get("questionId") != question_id:
                continue
            
            keywords = answer.get("keywords", [])
            keyword_count += keywords.count(keyword)
        
        if keyword_count > 0:
            trend_data.append({
                "date": date,
                "count": keyword_count
            })
    
    return sorted(trend_data, key=lambda x: x["date"])

