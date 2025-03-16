from itertools import combinations
from collections import defaultdict

def calculate_collab_score(sessions):
    pair_counts = defaultdict(int)
    total_sessions = len(sessions)
    
    for session in sessions:
        participants = session["participants"]
        # Generate all unique pairs in the session
        for pair in combinations(sorted(participants), 2):
            pair_counts[pair] += 1
    
    # Convert counts to normalized scores (0-1)
    collaboration_scores = {
        pair: count / total_sessions 
        for pair, count in pair_counts.items()
    }
    return collaboration_scores