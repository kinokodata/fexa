#!/usr/bin/env python3
import json

# Load the complete answers
with open('/Users/kinoko/work/kinokodata/fexa/2019_autumn_complete_answers.json', 'r', encoding='utf-8') as f:
    answers = json.load(f)

# Generate SQL UPDATE statements for questions table (explanations)
questions_sql = []
for qnum_str, data in answers.items():
    qnum = int(qnum_str)
    question_id = data['question_id']
    explanation = data['explanation'].replace("'", "''")  # Escape single quotes
    
    sql = f"UPDATE questions SET explanation = '{explanation}' WHERE id = '{question_id}';"
    questions_sql.append(sql)

# Generate SQL UPDATE statements for choices table (is_correct flags)
choices_sql = []
for qnum_str, data in answers.items():
    qnum = int(qnum_str)
    correct_answer = data['correct_answer']
    choices = data['choices']
    
    # First, reset all choices to false for this question
    for choice_label, choice_id in choices.items():
        sql = f"UPDATE choices SET is_correct = false WHERE id = '{choice_id}';"
        choices_sql.append(sql)
    
    # Then set the correct answer to true
    if correct_answer in choices:
        correct_choice_id = choices[correct_answer]
        sql = f"UPDATE choices SET is_correct = true WHERE id = '{correct_choice_id}';"
        choices_sql.append(sql)

# Write questions SQL to file
with open('/Users/kinoko/work/kinokodata/fexa/2019_autumn_questions_update.sql', 'w', encoding='utf-8') as f:
    f.write("-- Update explanations for 2019 autumn exam questions\n")
    f.write("-- Generated automatically\n\n")
    for sql in questions_sql:
        f.write(sql + "\n")

# Write choices SQL to file
with open('/Users/kinoko/work/kinokodata/fexa/2019_autumn_choices_update.sql', 'w', encoding='utf-8') as f:
    f.write("-- Update is_correct flags for 2019 autumn exam choices\n")
    f.write("-- Generated automatically\n\n")
    for sql in choices_sql:
        f.write(sql + "\n")

print(f"Generated SQL files:")
print(f"- 2019_autumn_questions_update.sql: {len(questions_sql)} statements")
print(f"- 2019_autumn_choices_update.sql: {len(choices_sql)} statements")

# Create a combined SQL file for easier execution
combined_sql = []
combined_sql.extend(questions_sql)
combined_sql.extend(choices_sql)

with open('/Users/kinoko/work/kinokodata/fexa/2019_autumn_complete_update.sql', 'w', encoding='utf-8') as f:
    f.write("-- Complete update for 2019 autumn exam\n")
    f.write("-- Updates both explanations and correct answer flags\n")
    f.write("-- Generated automatically\n\n")
    f.write("BEGIN;\n\n")
    for sql in combined_sql:
        f.write(sql + "\n")
    f.write("\nCOMMIT;\n")

print(f"- 2019_autumn_complete_update.sql: {len(combined_sql)} statements (combined)")