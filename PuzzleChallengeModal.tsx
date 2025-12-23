import React, { useState, useEffect, useCallback } from 'react';
import { X, Brain, HelpCircle, Lightbulb, Clock, Check, XCircle, Users, Shuffle, Grid3X3, Eye, Zap, Hash, Type, Palette } from 'lucide-react';

// Types for different puzzle challenges
export type PuzzleType = 'trivia' | 'riddle' | 'math' | 'memory' | 'sequence' | 'wordscramble' | 'wordassociation' | 'match3' | 'patternmatch' | 'anagram' | 'numbersequence' | 'colorpattern';

export interface PuzzleChallenge {
  id: string;
  type: PuzzleType;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  hint?: string;
  timeLimit: number;
  points: number;
  gameData?: any;
}

// EXPANDED Question banks - MANY more questions to avoid repetition
// MASSIVELY EXPANDED Question banks - 200+ questions to avoid repetition
const TRIVIA_QUESTIONS: { easy: PuzzleChallenge[], medium: PuzzleChallenge[], hard: PuzzleChallenge[] } = {
  easy: [
    { id: 't1', type: 'trivia', difficulty: 'easy', question: 'What color is the sky on a clear day?', options: ['Blue', 'Green', 'Red', 'Yellow'], correctAnswer: 'Blue', timeLimit: 15, points: 10 },
    { id: 't2', type: 'trivia', difficulty: 'easy', question: 'How many legs does a dog have?', options: ['2', '4', '6', '8'], correctAnswer: '4', timeLimit: 15, points: 10 },
    { id: 't3', type: 'trivia', difficulty: 'easy', question: 'What is the largest planet in our solar system?', options: ['Earth', 'Mars', 'Jupiter', 'Saturn'], correctAnswer: 'Jupiter', timeLimit: 15, points: 10 },
    { id: 't4', type: 'trivia', difficulty: 'easy', question: 'What do bees make?', options: ['Milk', 'Honey', 'Bread', 'Cheese'], correctAnswer: 'Honey', timeLimit: 15, points: 10 },
    { id: 't5', type: 'trivia', difficulty: 'easy', question: 'How many days are in a week?', options: ['5', '6', '7', '8'], correctAnswer: '7', timeLimit: 15, points: 10 },
    { id: 't6', type: 'trivia', difficulty: 'easy', question: 'What animal says "meow"?', options: ['Dog', 'Cat', 'Bird', 'Fish'], correctAnswer: 'Cat', timeLimit: 15, points: 10 },
    { id: 't7', type: 'trivia', difficulty: 'easy', question: 'What color are bananas?', options: ['Red', 'Blue', 'Yellow', 'Green'], correctAnswer: 'Yellow', timeLimit: 15, points: 10 },
    { id: 't8', type: 'trivia', difficulty: 'easy', question: 'How many sides does a triangle have?', options: ['2', '3', '4', '5'], correctAnswer: '3', timeLimit: 15, points: 10 },
    { id: 't9', type: 'trivia', difficulty: 'easy', question: 'What is frozen water called?', options: ['Steam', 'Ice', 'Fog', 'Rain'], correctAnswer: 'Ice', timeLimit: 15, points: 10 },
    { id: 't10', type: 'trivia', difficulty: 'easy', question: 'What is the opposite of hot?', options: ['Warm', 'Cold', 'Cool', 'Mild'], correctAnswer: 'Cold', timeLimit: 15, points: 10 },
    { id: 't11', type: 'trivia', difficulty: 'easy', question: 'How many months are in a year?', options: ['10', '11', '12', '13'], correctAnswer: '12', timeLimit: 15, points: 10 },
    { id: 't12', type: 'trivia', difficulty: 'easy', question: 'What animal is known as man\'s best friend?', options: ['Cat', 'Dog', 'Bird', 'Fish'], correctAnswer: 'Dog', timeLimit: 15, points: 10 },
    { id: 't13', type: 'trivia', difficulty: 'easy', question: 'What do you use to write on paper?', options: ['Spoon', 'Pen', 'Fork', 'Cup'], correctAnswer: 'Pen', timeLimit: 15, points: 10 },
    { id: 't14', type: 'trivia', difficulty: 'easy', question: 'What color is grass?', options: ['Blue', 'Red', 'Green', 'Yellow'], correctAnswer: 'Green', timeLimit: 15, points: 10 },
    { id: 't15', type: 'trivia', difficulty: 'easy', question: 'How many hours are in a day?', options: ['12', '20', '24', '30'], correctAnswer: '24', timeLimit: 15, points: 10 },
    { id: 't16', type: 'trivia', difficulty: 'easy', question: 'What season comes after winter?', options: ['Summer', 'Fall', 'Spring', 'Winter'], correctAnswer: 'Spring', timeLimit: 15, points: 10 },
    { id: 't17', type: 'trivia', difficulty: 'easy', question: 'What do cows produce?', options: ['Eggs', 'Milk', 'Honey', 'Wool'], correctAnswer: 'Milk', timeLimit: 15, points: 10 },
    { id: 't18', type: 'trivia', difficulty: 'easy', question: 'What is the first letter of the alphabet?', options: ['B', 'A', 'C', 'Z'], correctAnswer: 'A', timeLimit: 15, points: 10 },
    { id: 't19', type: 'trivia', difficulty: 'easy', question: 'What shape is a stop sign?', options: ['Circle', 'Square', 'Octagon', 'Triangle'], correctAnswer: 'Octagon', timeLimit: 15, points: 10 },
    { id: 't20', type: 'trivia', difficulty: 'easy', question: 'What is the opposite of up?', options: ['Left', 'Right', 'Down', 'Forward'], correctAnswer: 'Down', timeLimit: 15, points: 10 },
    { id: 't21', type: 'trivia', difficulty: 'easy', question: 'How many wheels does a bicycle have?', options: ['1', '2', '3', '4'], correctAnswer: '2', timeLimit: 15, points: 10 },
    { id: 't22', type: 'trivia', difficulty: 'easy', question: 'What animal has a trunk?', options: ['Giraffe', 'Elephant', 'Lion', 'Bear'], correctAnswer: 'Elephant', timeLimit: 15, points: 10 },
    { id: 't23', type: 'trivia', difficulty: 'easy', question: 'What color is a fire truck?', options: ['Blue', 'Green', 'Red', 'Yellow'], correctAnswer: 'Red', timeLimit: 15, points: 10 },
    { id: 't24', type: 'trivia', difficulty: 'easy', question: 'What do chickens lay?', options: ['Milk', 'Eggs', 'Wool', 'Honey'], correctAnswer: 'Eggs', timeLimit: 15, points: 10 },
    { id: 't25', type: 'trivia', difficulty: 'easy', question: 'What is the largest ocean?', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correctAnswer: 'Pacific', timeLimit: 15, points: 10 },
    { id: 't26', type: 'trivia', difficulty: 'easy', question: 'How many fingers do humans have?', options: ['8', '10', '12', '6'], correctAnswer: '10', timeLimit: 15, points: 10 },
    { id: 't27', type: 'trivia', difficulty: 'easy', question: 'What planet do we live on?', options: ['Mars', 'Venus', 'Earth', 'Jupiter'], correctAnswer: 'Earth', timeLimit: 15, points: 10 },
    { id: 't28', type: 'trivia', difficulty: 'easy', question: 'What is baby cat called?', options: ['Puppy', 'Kitten', 'Cub', 'Calf'], correctAnswer: 'Kitten', timeLimit: 15, points: 10 },
    { id: 't29', type: 'trivia', difficulty: 'easy', question: 'What do you call frozen rain?', options: ['Snow', 'Hail', 'Sleet', 'Frost'], correctAnswer: 'Hail', timeLimit: 15, points: 10 },
    { id: 't30', type: 'trivia', difficulty: 'easy', question: 'What fruit is orange and round?', options: ['Apple', 'Banana', 'Orange', 'Grape'], correctAnswer: 'Orange', timeLimit: 15, points: 10 },
  ],
  medium: [
    { id: 't31', type: 'trivia', difficulty: 'medium', question: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'], correctAnswer: 'Paris', timeLimit: 12, points: 20 },
    { id: 't32', type: 'trivia', difficulty: 'medium', question: 'Which ocean is the largest?', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correctAnswer: 'Pacific', timeLimit: 12, points: 20 },
    { id: 't33', type: 'trivia', difficulty: 'medium', question: 'What year did World War II end?', options: ['1943', '1944', '1945', '1946'], correctAnswer: '1945', timeLimit: 12, points: 20 },
    { id: 't34', type: 'trivia', difficulty: 'medium', question: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correctAnswer: 'Au', timeLimit: 12, points: 20 },
    { id: 't35', type: 'trivia', difficulty: 'medium', question: 'How many continents are there?', options: ['5', '6', '7', '8'], correctAnswer: '7', timeLimit: 12, points: 20 },
    { id: 't36', type: 'trivia', difficulty: 'medium', question: 'What is the capital of Japan?', options: ['Seoul', 'Beijing', 'Tokyo', 'Bangkok'], correctAnswer: 'Tokyo', timeLimit: 12, points: 20 },
    { id: 't37', type: 'trivia', difficulty: 'medium', question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Mercury'], correctAnswer: 'Mars', timeLimit: 12, points: 20 },
    { id: 't38', type: 'trivia', difficulty: 'medium', question: 'What is the largest mammal?', options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippo'], correctAnswer: 'Blue Whale', timeLimit: 12, points: 20 },
    { id: 't39', type: 'trivia', difficulty: 'medium', question: 'Who wrote Romeo and Juliet?', options: ['Dickens', 'Shakespeare', 'Austen', 'Hemingway'], correctAnswer: 'Shakespeare', timeLimit: 12, points: 20 },
    { id: 't40', type: 'trivia', difficulty: 'medium', question: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], correctAnswer: 'Canberra', timeLimit: 12, points: 20 },
    { id: 't41', type: 'trivia', difficulty: 'medium', question: 'How many bones are in the human body?', options: ['106', '156', '206', '256'], correctAnswer: '206', timeLimit: 12, points: 20 },
    { id: 't42', type: 'trivia', difficulty: 'medium', question: 'What is the longest river in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], correctAnswer: 'Nile', timeLimit: 12, points: 20 },
    { id: 't43', type: 'trivia', difficulty: 'medium', question: 'What gas do plants absorb?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctAnswer: 'Carbon Dioxide', timeLimit: 12, points: 20 },
    { id: 't44', type: 'trivia', difficulty: 'medium', question: 'What is the capital of Canada?', options: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], correctAnswer: 'Ottawa', timeLimit: 12, points: 20 },
    { id: 't45', type: 'trivia', difficulty: 'medium', question: 'Which element has the symbol Fe?', options: ['Fluorine', 'Iron', 'Fermium', 'Francium'], correctAnswer: 'Iron', timeLimit: 12, points: 20 },
    { id: 't46', type: 'trivia', difficulty: 'medium', question: 'What is the capital of Italy?', options: ['Milan', 'Venice', 'Rome', 'Florence'], correctAnswer: 'Rome', timeLimit: 12, points: 20 },
    { id: 't47', type: 'trivia', difficulty: 'medium', question: 'How many players on a soccer team?', options: ['9', '10', '11', '12'], correctAnswer: '11', timeLimit: 12, points: 20 },
    { id: 't48', type: 'trivia', difficulty: 'medium', question: 'What is the largest desert?', options: ['Sahara', 'Gobi', 'Antarctic', 'Arabian'], correctAnswer: 'Antarctic', timeLimit: 12, points: 20 },
    { id: 't49', type: 'trivia', difficulty: 'medium', question: 'Who painted the Sistine Chapel ceiling?', options: ['Da Vinci', 'Michelangelo', 'Raphael', 'Botticelli'], correctAnswer: 'Michelangelo', timeLimit: 12, points: 20 },
    { id: 't50', type: 'trivia', difficulty: 'medium', question: 'What is the smallest planet?', options: ['Mars', 'Mercury', 'Venus', 'Pluto'], correctAnswer: 'Mercury', timeLimit: 12, points: 20 },
    { id: 't51', type: 'trivia', difficulty: 'medium', question: 'What year did the Titanic sink?', options: ['1910', '1912', '1914', '1916'], correctAnswer: '1912', timeLimit: 12, points: 20 },
    { id: 't52', type: 'trivia', difficulty: 'medium', question: 'What is the currency of Japan?', options: ['Yuan', 'Won', 'Yen', 'Ringgit'], correctAnswer: 'Yen', timeLimit: 12, points: 20 },
    { id: 't53', type: 'trivia', difficulty: 'medium', question: 'How many teeth do adults have?', options: ['28', '30', '32', '34'], correctAnswer: '32', timeLimit: 12, points: 20 },
    { id: 't54', type: 'trivia', difficulty: 'medium', question: 'What is the capital of Spain?', options: ['Barcelona', 'Madrid', 'Seville', 'Valencia'], correctAnswer: 'Madrid', timeLimit: 12, points: 20 },
    { id: 't55', type: 'trivia', difficulty: 'medium', question: 'What is the largest bird?', options: ['Eagle', 'Ostrich', 'Condor', 'Albatross'], correctAnswer: 'Ostrich', timeLimit: 12, points: 20 },
  ],
  hard: [
    { id: 't56', type: 'trivia', difficulty: 'hard', question: 'What is the smallest country in the world?', options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], correctAnswer: 'Vatican City', timeLimit: 10, points: 30 },
    { id: 't57', type: 'trivia', difficulty: 'hard', question: 'In what year was the first iPhone released?', options: ['2005', '2006', '2007', '2008'], correctAnswer: '2007', timeLimit: 10, points: 30 },
    { id: 't58', type: 'trivia', difficulty: 'hard', question: 'What is the hardest natural substance on Earth?', options: ['Gold', 'Iron', 'Diamond', 'Platinum'], correctAnswer: 'Diamond', timeLimit: 10, points: 30 },
    { id: 't59', type: 'trivia', difficulty: 'hard', question: 'Which planet has the most moons?', options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], correctAnswer: 'Saturn', timeLimit: 10, points: 30 },
    { id: 't60', type: 'trivia', difficulty: 'hard', question: 'What is the speed of light in km/s?', options: ['200,000', '250,000', '300,000', '350,000'], correctAnswer: '300,000', timeLimit: 10, points: 30 },
    { id: 't61', type: 'trivia', difficulty: 'hard', question: 'Who painted the Mona Lisa?', options: ['Michelangelo', 'Da Vinci', 'Raphael', 'Donatello'], correctAnswer: 'Da Vinci', timeLimit: 10, points: 30 },
    { id: 't62', type: 'trivia', difficulty: 'hard', question: 'What is the deepest ocean trench?', options: ['Java Trench', 'Mariana Trench', 'Puerto Rico Trench', 'Tonga Trench'], correctAnswer: 'Mariana Trench', timeLimit: 10, points: 30 },
    { id: 't63', type: 'trivia', difficulty: 'hard', question: 'What year was the Berlin Wall torn down?', options: ['1987', '1988', '1989', '1990'], correctAnswer: '1989', timeLimit: 10, points: 30 },
    { id: 't64', type: 'trivia', difficulty: 'hard', question: 'What is the chemical formula for water?', options: ['HO', 'H2O', 'H2O2', 'OH2'], correctAnswer: 'H2O', timeLimit: 10, points: 30 },
    { id: 't65', type: 'trivia', difficulty: 'hard', question: 'Which country has the most time zones?', options: ['Russia', 'USA', 'China', 'France'], correctAnswer: 'France', timeLimit: 10, points: 30 },
    { id: 't66', type: 'trivia', difficulty: 'hard', question: 'What is the rarest blood type?', options: ['A-', 'B-', 'AB-', 'O-'], correctAnswer: 'AB-', timeLimit: 10, points: 30 },
    { id: 't67', type: 'trivia', difficulty: 'hard', question: 'Who discovered penicillin?', options: ['Pasteur', 'Fleming', 'Curie', 'Darwin'], correctAnswer: 'Fleming', timeLimit: 10, points: 30 },
    { id: 't68', type: 'trivia', difficulty: 'hard', question: 'What is the longest bone in the body?', options: ['Tibia', 'Femur', 'Humerus', 'Spine'], correctAnswer: 'Femur', timeLimit: 10, points: 30 },
    { id: 't69', type: 'trivia', difficulty: 'hard', question: 'What year did man first walk on the moon?', options: ['1967', '1968', '1969', '1970'], correctAnswer: '1969', timeLimit: 10, points: 30 },
    { id: 't70', type: 'trivia', difficulty: 'hard', question: 'What is the capital of Mongolia?', options: ['Astana', 'Ulaanbaatar', 'Bishkek', 'Tashkent'], correctAnswer: 'Ulaanbaatar', timeLimit: 10, points: 30 },
    { id: 't71', type: 'trivia', difficulty: 'hard', question: 'How many symphonies did Beethoven compose?', options: ['7', '8', '9', '10'], correctAnswer: '9', timeLimit: 10, points: 30 },
    { id: 't72', type: 'trivia', difficulty: 'hard', question: 'What is the atomic number of carbon?', options: ['4', '6', '8', '12'], correctAnswer: '6', timeLimit: 10, points: 30 },
    { id: 't73', type: 'trivia', difficulty: 'hard', question: 'Who wrote "1984"?', options: ['Huxley', 'Orwell', 'Bradbury', 'Asimov'], correctAnswer: 'Orwell', timeLimit: 10, points: 30 },
    { id: 't74', type: 'trivia', difficulty: 'hard', question: 'What is the largest organ in the human body?', options: ['Liver', 'Brain', 'Skin', 'Heart'], correctAnswer: 'Skin', timeLimit: 10, points: 30 },
    { id: 't75', type: 'trivia', difficulty: 'hard', question: 'What year was the Declaration of Independence signed?', options: ['1774', '1775', '1776', '1777'], correctAnswer: '1776', timeLimit: 10, points: 30 },
  ],
};


const RIDDLES: { easy: PuzzleChallenge[], medium: PuzzleChallenge[], hard: PuzzleChallenge[] } = {
  easy: [
    { id: 'r1', type: 'riddle', difficulty: 'easy', question: 'I have hands but cannot clap. What am I?', options: ['Clock', 'Gloves', 'Tree', 'Robot'], correctAnswer: 'Clock', hint: 'I tell time', timeLimit: 20, points: 15 },
    { id: 'r2', type: 'riddle', difficulty: 'easy', question: 'What has a head and a tail but no body?', options: ['Snake', 'Coin', 'Fish', 'Arrow'], correctAnswer: 'Coin', hint: 'You use me to buy things', timeLimit: 20, points: 15 },
    { id: 'r3', type: 'riddle', difficulty: 'easy', question: 'What gets wetter the more it dries?', options: ['Sponge', 'Towel', 'Paper', 'Sand'], correctAnswer: 'Towel', hint: 'You use me after a shower', timeLimit: 20, points: 15 },
    { id: 'r4', type: 'riddle', difficulty: 'easy', question: 'What has keys but no locks?', options: ['Piano', 'Map', 'Phone', 'Car'], correctAnswer: 'Piano', hint: 'It makes music', timeLimit: 20, points: 15 },
    { id: 'r5', type: 'riddle', difficulty: 'easy', question: 'What has a face but cannot smile?', options: ['Clock', 'Mirror', 'Book', 'Phone'], correctAnswer: 'Clock', hint: 'It shows numbers', timeLimit: 20, points: 15 },
    { id: 'r6', type: 'riddle', difficulty: 'easy', question: 'What has legs but cannot walk?', options: ['Table', 'Snake', 'Fish', 'Bird'], correctAnswer: 'Table', hint: 'You eat on it', timeLimit: 20, points: 15 },
    { id: 'r7', type: 'riddle', difficulty: 'easy', question: 'What has ears but cannot hear?', options: ['Corn', 'Dog', 'Cat', 'Rabbit'], correctAnswer: 'Corn', hint: 'It\'s a vegetable', timeLimit: 20, points: 15 },
    { id: 'r8', type: 'riddle', difficulty: 'easy', question: 'What has a neck but no head?', options: ['Bottle', 'Giraffe', 'Snake', 'Person'], correctAnswer: 'Bottle', hint: 'You drink from it', timeLimit: 20, points: 15 },
    { id: 'r9', type: 'riddle', difficulty: 'easy', question: 'What can you catch but not throw?', options: ['Ball', 'Cold', 'Frisbee', 'Fish'], correctAnswer: 'Cold', hint: 'It makes you sick', timeLimit: 20, points: 15 },
    { id: 'r10', type: 'riddle', difficulty: 'easy', question: 'What has words but never speaks?', options: ['Book', 'Person', 'Radio', 'TV'], correctAnswer: 'Book', hint: 'You read it', timeLimit: 20, points: 15 },
    { id: 'r11', type: 'riddle', difficulty: 'easy', question: 'What has a thumb and four fingers but is not alive?', options: ['Glove', 'Hand', 'Robot', 'Statue'], correctAnswer: 'Glove', hint: 'You wear it', timeLimit: 20, points: 15 },
    { id: 'r12', type: 'riddle', difficulty: 'easy', question: 'What has holes but still holds water?', options: ['Sponge', 'Bucket', 'Cup', 'Bowl'], correctAnswer: 'Sponge', hint: 'Used for cleaning', timeLimit: 20, points: 15 },
    { id: 'r13', type: 'riddle', difficulty: 'easy', question: 'What has a bottom at the top?', options: ['Leg', 'Mountain', 'Tree', 'Building'], correctAnswer: 'Leg', hint: 'Part of your body', timeLimit: 20, points: 15 },
    { id: 'r14', type: 'riddle', difficulty: 'easy', question: 'What can you break without touching?', options: ['Promise', 'Glass', 'Egg', 'Stick'], correctAnswer: 'Promise', hint: 'Made with words', timeLimit: 20, points: 15 },
    { id: 'r15', type: 'riddle', difficulty: 'easy', question: 'What building has the most stories?', options: ['Library', 'Skyscraper', 'Hotel', 'School'], correctAnswer: 'Library', hint: 'Think about books', timeLimit: 20, points: 15 },
  ],
  medium: [
    { id: 'r16', type: 'riddle', difficulty: 'medium', question: 'I speak without a mouth and hear without ears. What am I?', options: ['Echo', 'Wind', 'Shadow', 'Dream'], correctAnswer: 'Echo', hint: 'I repeat what you say', timeLimit: 18, points: 25 },
    { id: 'r17', type: 'riddle', difficulty: 'medium', question: 'The more you take, the more you leave behind. What am I?', options: ['Footsteps', 'Time', 'Money', 'Memories'], correctAnswer: 'Footsteps', hint: 'You make me when you walk', timeLimit: 18, points: 25 },
    { id: 'r18', type: 'riddle', difficulty: 'medium', question: 'What can travel around the world while staying in a corner?', options: ['Stamp', 'Spider', 'Shadow', 'Wind'], correctAnswer: 'Stamp', hint: 'I go on letters', timeLimit: 18, points: 25 },
    { id: 'r19', type: 'riddle', difficulty: 'medium', question: 'What has teeth but cannot bite?', options: ['Comb', 'Saw', 'Zipper', 'Gear'], correctAnswer: 'Comb', hint: 'Used for hair', timeLimit: 18, points: 25 },
    { id: 'r20', type: 'riddle', difficulty: 'medium', question: 'I have cities, but no houses live there. What am I?', options: ['Map', 'Globe', 'Atlas', 'GPS'], correctAnswer: 'Map', hint: 'I help you navigate', timeLimit: 18, points: 25 },
    { id: 'r21', type: 'riddle', difficulty: 'medium', question: 'What has a ring but no finger?', options: ['Phone', 'Bell', 'Tree', 'Planet'], correctAnswer: 'Phone', hint: 'You answer it', timeLimit: 18, points: 25 },
    { id: 'r22', type: 'riddle', difficulty: 'medium', question: 'What goes up but never comes down?', options: ['Age', 'Balloon', 'Rocket', 'Bird'], correctAnswer: 'Age', hint: 'Everyone has it', timeLimit: 18, points: 25 },
    { id: 'r23', type: 'riddle', difficulty: 'medium', question: 'What can run but cannot walk?', options: ['Water', 'Car', 'Horse', 'Wind'], correctAnswer: 'Water', hint: 'It flows', timeLimit: 18, points: 25 },
    { id: 'r24', type: 'riddle', difficulty: 'medium', question: 'What has a bed but never sleeps?', options: ['River', 'Hotel', 'Hospital', 'House'], correctAnswer: 'River', hint: 'It flows', timeLimit: 18, points: 25 },
    { id: 'r25', type: 'riddle', difficulty: 'medium', question: 'What can be broken without being touched?', options: ['Promise', 'Glass', 'Egg', 'Heart'], correctAnswer: 'Promise', hint: 'You make it with words', timeLimit: 18, points: 25 },
    { id: 'r26', type: 'riddle', difficulty: 'medium', question: 'What has an eye but cannot see?', options: ['Needle', 'Potato', 'Storm', 'All of these'], correctAnswer: 'Needle', hint: 'Used for sewing', timeLimit: 18, points: 25 },
    { id: 'r27', type: 'riddle', difficulty: 'medium', question: 'What gets sharper the more you use it?', options: ['Brain', 'Knife', 'Pencil', 'Scissors'], correctAnswer: 'Brain', hint: 'Think about it', timeLimit: 18, points: 25 },
    { id: 'r28', type: 'riddle', difficulty: 'medium', question: 'What has a bark but no bite?', options: ['Tree', 'Dog', 'Wolf', 'Fox'], correctAnswer: 'Tree', hint: 'It grows in forests', timeLimit: 18, points: 25 },
    { id: 'r29', type: 'riddle', difficulty: 'medium', question: 'What comes once in a minute, twice in a moment, but never in a thousand years?', options: ['Letter M', 'Time', 'Chance', 'Luck'], correctAnswer: 'Letter M', hint: 'Look at the spelling', timeLimit: 18, points: 25 },
    { id: 'r30', type: 'riddle', difficulty: 'medium', question: 'What belongs to you but others use it more than you?', options: ['Your name', 'Your car', 'Your phone', 'Your house'], correctAnswer: 'Your name', hint: 'People call you by it', timeLimit: 18, points: 25 },
  ],
  hard: [
    { id: 'r31', type: 'riddle', difficulty: 'hard', question: 'I am not alive, but I grow; I don\'t have lungs, but I need air. What am I?', options: ['Fire', 'Plant', 'Crystal', 'Cloud'], correctAnswer: 'Fire', hint: 'I am hot and dangerous', timeLimit: 15, points: 35 },
    { id: 'r32', type: 'riddle', difficulty: 'hard', question: 'What can fill a room but takes up no space?', options: ['Light', 'Air', 'Sound', 'Smell'], correctAnswer: 'Light', hint: 'Turn me on when it\'s dark', timeLimit: 15, points: 35 },
    { id: 'r33', type: 'riddle', difficulty: 'hard', question: 'What disappears as soon as you say its name?', options: ['Silence', 'Shadow', 'Secret', 'Dream'], correctAnswer: 'Silence', hint: 'Speaking breaks it', timeLimit: 15, points: 35 },
    { id: 'r34', type: 'riddle', difficulty: 'hard', question: 'I can be cracked, made, told, and played. What am I?', options: ['Joke', 'Code', 'Story', 'Game'], correctAnswer: 'Joke', hint: 'Makes people laugh', timeLimit: 15, points: 35 },
    { id: 'r35', type: 'riddle', difficulty: 'hard', question: 'What has roots nobody sees, is taller than trees, yet never grows?', options: ['Mountain', 'Building', 'Tower', 'Statue'], correctAnswer: 'Mountain', hint: 'Nature made it', timeLimit: 15, points: 35 },
    { id: 'r36', type: 'riddle', difficulty: 'hard', question: 'I fly without wings. I cry without eyes. What am I?', options: ['Cloud', 'Wind', 'Rain', 'Storm'], correctAnswer: 'Cloud', hint: 'Look up', timeLimit: 15, points: 35 },
    { id: 'r37', type: 'riddle', difficulty: 'hard', question: 'What is always in front of you but can\'t be seen?', options: ['Future', 'Air', 'Time', 'Space'], correctAnswer: 'Future', hint: 'It hasn\'t happened yet', timeLimit: 15, points: 35 },
    { id: 'r38', type: 'riddle', difficulty: 'hard', question: 'What can you keep after giving it to someone?', options: ['Your word', 'Money', 'Gift', 'Time'], correctAnswer: 'Your word', hint: 'It\'s a promise', timeLimit: 15, points: 35 },
    { id: 'r39', type: 'riddle', difficulty: 'hard', question: 'What has a head, a tail, is brown, and has no legs?', options: ['Penny', 'Snake', 'Worm', 'Slug'], correctAnswer: 'Penny', hint: 'A type of coin', timeLimit: 15, points: 35 },
    { id: 'r40', type: 'riddle', difficulty: 'hard', question: 'What invention lets you look right through a wall?', options: ['Window', 'X-ray', 'Camera', 'Telescope'], correctAnswer: 'Window', hint: 'Every house has them', timeLimit: 15, points: 35 },
    { id: 'r41', type: 'riddle', difficulty: 'hard', question: 'What has many keys but can\'t open a single lock?', options: ['Keyboard', 'Piano', 'Map', 'Dictionary'], correctAnswer: 'Keyboard', hint: 'You type on it', timeLimit: 15, points: 35 },
    { id: 'r42', type: 'riddle', difficulty: 'hard', question: 'What can you hold in your right hand but never in your left?', options: ['Your left hand', 'Your right elbow', 'Nothing', 'Air'], correctAnswer: 'Your left hand', hint: 'Think about body parts', timeLimit: 15, points: 35 },
  ],
};


// REDUCED Math problems - only essential ones
const MATH_PROBLEMS: { easy: PuzzleChallenge[], medium: PuzzleChallenge[], hard: PuzzleChallenge[] } = {
  easy: [
    { id: 'm1', type: 'math', difficulty: 'easy', question: 'What is 5 + 7?', options: ['10', '11', '12', '13'], correctAnswer: '12', timeLimit: 10, points: 10 },
    { id: 'm2', type: 'math', difficulty: 'easy', question: 'What is 15 - 8?', options: ['5', '6', '7', '8'], correctAnswer: '7', timeLimit: 10, points: 10 },
    { id: 'm3', type: 'math', difficulty: 'easy', question: 'What is 3 × 4?', options: ['10', '11', '12', '14'], correctAnswer: '12', timeLimit: 10, points: 10 },
    { id: 'm4', type: 'math', difficulty: 'easy', question: 'What is 20 ÷ 4?', options: ['4', '5', '6', '7'], correctAnswer: '5', timeLimit: 10, points: 10 },
  ],
  medium: [
    { id: 'm5', type: 'math', difficulty: 'medium', question: 'What is 17 × 6?', options: ['96', '102', '108', '112'], correctAnswer: '102', timeLimit: 15, points: 20 },
    { id: 'm6', type: 'math', difficulty: 'medium', question: 'What is 144 ÷ 12?', options: ['10', '11', '12', '14'], correctAnswer: '12', timeLimit: 15, points: 20 },
    { id: 'm7', type: 'math', difficulty: 'medium', question: 'What is 25% of 80?', options: ['15', '20', '25', '30'], correctAnswer: '20', timeLimit: 15, points: 20 },
  ],
  hard: [
    { id: 'm8', type: 'math', difficulty: 'hard', question: 'What is √169?', options: ['11', '12', '13', '14'], correctAnswer: '13', timeLimit: 12, points: 30 },
    { id: 'm9', type: 'math', difficulty: 'hard', question: 'What is 15% of 240?', options: ['32', '34', '36', '38'], correctAnswer: '36', timeLimit: 12, points: 30 },
  ],
};

// EXPANDED Word Scrambles
const WORD_SCRAMBLES: { easy: PuzzleChallenge[], medium: PuzzleChallenge[], hard: PuzzleChallenge[] } = {
  easy: [
    { id: 'w1', type: 'wordscramble', difficulty: 'easy', question: 'Unscramble: PPALE', options: ['APPLE', 'PAPER', 'PLANE', 'PLATE'], correctAnswer: 'APPLE', hint: 'A fruit', timeLimit: 15, points: 10 },
    { id: 'w2', type: 'wordscramble', difficulty: 'easy', question: 'Unscramble: OHUSE', options: ['HOUSE', 'HORSE', 'MOUSE', 'HOSE'], correctAnswer: 'HOUSE', hint: 'You live in it', timeLimit: 15, points: 10 },
    { id: 'w3', type: 'wordscramble', difficulty: 'easy', question: 'Unscramble: KOBO', options: ['BOOK', 'COOK', 'LOOK', 'HOOK'], correctAnswer: 'BOOK', hint: 'You read it', timeLimit: 15, points: 10 },
    { id: 'w4', type: 'wordscramble', difficulty: 'easy', question: 'Unscramble: ETRE', options: ['TREE', 'FREE', 'FLEE', 'THEE'], correctAnswer: 'TREE', hint: 'It has leaves', timeLimit: 15, points: 10 },
    { id: 'w5', type: 'wordscramble', difficulty: 'easy', question: 'Unscramble: ODGO', options: ['GOOD', 'FOOD', 'MOOD', 'WOOD'], correctAnswer: 'GOOD', hint: 'Opposite of bad', timeLimit: 15, points: 10 },
    { id: 'w6', type: 'wordscramble', difficulty: 'easy', question: 'Unscramble: TAWRE', options: ['WATER', 'LATER', 'CATER', 'HATER'], correctAnswer: 'WATER', hint: 'You drink it', timeLimit: 15, points: 10 },
    { id: 'w7', type: 'wordscramble', difficulty: 'easy', question: 'Unscramble: NOMO', options: ['MOON', 'NOON', 'SOON', 'BOON'], correctAnswer: 'MOON', hint: 'In the night sky', timeLimit: 15, points: 10 },
    { id: 'w8', type: 'wordscramble', difficulty: 'easy', question: 'Unscramble: IRDB', options: ['BIRD', 'GRID', 'GIRD', 'BRIG'], correctAnswer: 'BIRD', hint: 'It can fly', timeLimit: 15, points: 10 },
    { id: 'w9', type: 'wordscramble', difficulty: 'easy', question: 'Unscramble: TAOC', options: ['COAT', 'BOAT', 'MOAT', 'GOAT'], correctAnswer: 'COAT', hint: 'You wear it', timeLimit: 15, points: 10 },
    { id: 'w10', type: 'wordscramble', difficulty: 'easy', question: 'Unscramble: IFSH', options: ['FISH', 'WISH', 'DISH', 'SWISH'], correctAnswer: 'FISH', hint: 'Lives in water', timeLimit: 15, points: 10 },
    { id: 'w11', type: 'wordscramble', difficulty: 'easy', question: 'Unscramble: RATNI', options: ['TRAIN', 'BRAIN', 'DRAIN', 'GRAIN'], correctAnswer: 'TRAIN', hint: 'Transportation on tracks', timeLimit: 15, points: 10 },
    { id: 'w12', type: 'wordscramble', difficulty: 'easy', question: 'Unscramble: CHUS', options: ['SUCH', 'MUCH', 'OUCH', 'RUSH'], correctAnswer: 'SUCH', hint: 'Of that kind', timeLimit: 15, points: 10 },
  ],
  medium: [
    { id: 'w13', type: 'wordscramble', difficulty: 'medium', question: 'Unscramble: LPAENT', options: ['PLANET', 'PLATEN', 'PLANTS', 'PLAINT'], correctAnswer: 'PLANET', hint: 'Earth is one', timeLimit: 12, points: 20 },
    { id: 'w14', type: 'wordscramble', difficulty: 'medium', question: 'Unscramble: DARGNE', options: ['GARDEN', 'DANGER', 'GANDER', 'RANGED'], correctAnswer: 'GARDEN', hint: 'Flowers grow here', timeLimit: 12, points: 20 },
    { id: 'w15', type: 'wordscramble', difficulty: 'medium', question: 'Unscramble: CTOROD', options: ['DOCTOR', 'RECORD', 'DECOR', 'CORD'], correctAnswer: 'DOCTOR', hint: 'Heals people', timeLimit: 12, points: 20 },
    { id: 'w16', type: 'wordscramble', difficulty: 'medium', question: 'Unscramble: LOSCH', options: ['SCHOOL', 'STOOLS', 'COOLS', 'FOOLS'], correctAnswer: 'SCHOOL', hint: 'Where you learn', timeLimit: 12, points: 20 },
    { id: 'w17', type: 'wordscramble', difficulty: 'medium', question: 'Unscramble: TNIGHS', options: ['NIGHTS', 'THINGS', 'SIGHTS', 'LIGHTS'], correctAnswer: 'NIGHTS', hint: 'When it\'s dark', timeLimit: 12, points: 20 },
    { id: 'w18', type: 'wordscramble', difficulty: 'medium', question: 'Unscramble: FRENDI', options: ['FRIEND', 'FINDER', 'FENDER', 'RENDER'], correctAnswer: 'FRIEND', hint: 'Someone you like', timeLimit: 12, points: 20 },
    { id: 'w19', type: 'wordscramble', difficulty: 'medium', question: 'Unscramble: MSUIC', options: ['MUSIC', 'MUCUS', 'MUSCI', 'CUSIM'], correctAnswer: 'MUSIC', hint: 'You listen to it', timeLimit: 12, points: 20 },
    { id: 'w20', type: 'wordscramble', difficulty: 'medium', question: 'Unscramble: WNITER', options: ['WINTER', 'TWINER', 'WRITER', 'WINDER'], correctAnswer: 'WINTER', hint: 'Cold season', timeLimit: 12, points: 20 },
    { id: 'w21', type: 'wordscramble', difficulty: 'medium', question: 'Unscramble: CNEAO', options: ['OCEAN', 'CANOE', 'ACONE', 'OANCE'], correctAnswer: 'OCEAN', hint: 'Large body of water', timeLimit: 12, points: 20 },
    { id: 'w22', type: 'wordscramble', difficulty: 'medium', question: 'Unscramble: HTOER', options: ['OTHER', 'THERE', 'THREE', 'ETHER'], correctAnswer: 'OTHER', hint: 'Not this one', timeLimit: 12, points: 20 },
  ],
  hard: [
    { id: 'w23', type: 'wordscramble', difficulty: 'hard', question: 'Unscramble: ELHCAGNL', options: ['CHALLENGE', 'CHANGELOG', 'CHANGLE', 'LANGCHEL'], correctAnswer: 'CHALLENGE', hint: 'A difficult task', timeLimit: 15, points: 30 },
    { id: 'w24', type: 'wordscramble', difficulty: 'hard', question: 'Unscramble: YRTMSEY', options: ['MYSTERY', 'MASTERY', 'SYSTEMS', 'STREAMY'], correctAnswer: 'MYSTERY', hint: 'Something unknown', timeLimit: 15, points: 30 },
    { id: 'w25', type: 'wordscramble', difficulty: 'hard', question: 'Unscramble: ELPXMAE', options: ['EXAMPLE', 'COMPLEX', 'EXPEL', 'MAPLE'], correctAnswer: 'EXAMPLE', hint: 'A sample or model', timeLimit: 15, points: 30 },
    { id: 'w26', type: 'wordscramble', difficulty: 'hard', question: 'Unscramble: TREVADUNE', options: ['ADVENTURE', 'ADVERTUNE', 'VENTURED', 'DENATURE'], correctAnswer: 'ADVENTURE', hint: 'An exciting journey', timeLimit: 15, points: 30 },
    { id: 'w27', type: 'wordscramble', difficulty: 'hard', question: 'Unscramble: TUBEAFIUL', options: ['BEAUTIFUL', 'BOUNTIFUL', 'BEATIFUL', 'DUTIFUL'], correctAnswer: 'BEAUTIFUL', hint: 'Very pretty', timeLimit: 15, points: 30 },
    { id: 'w28', type: 'wordscramble', difficulty: 'hard', question: 'Unscramble: PORTMIANT', options: ['IMPORTANT', 'IMPARTANT', 'PORTMAINT', 'TRAMPOINT'], correctAnswer: 'IMPORTANT', hint: 'Significant', timeLimit: 15, points: 30 },
    { id: 'w29', type: 'wordscramble', difficulty: 'hard', question: 'Unscramble: NITERESTIG', options: ['INTERESTING', 'INTEGRITES', 'RESETTING', 'STRINGITE'], correctAnswer: 'INTERESTING', hint: 'Captures attention', timeLimit: 15, points: 30 },
    { id: 'w30', type: 'wordscramble', difficulty: 'hard', question: 'Unscramble: TIONEDUCA', options: ['EDUCATION', 'AUCTIONED', 'CAUTIONED', 'OUTDIANCE'], correctAnswer: 'EDUCATION', hint: 'Learning process', timeLimit: 15, points: 30 },
  ],
};

// EXPANDED and HARDER Word Association puzzles - abstract connections, not just compound words
const WORD_ASSOCIATIONS: { easy: PuzzleChallenge[], medium: PuzzleChallenge[], hard: PuzzleChallenge[] } = {
  easy: [
    { id: 'wa1', type: 'wordassociation', difficulty: 'easy', question: 'What word connects: DOCTOR, NURSE, PATIENT?', options: ['Hospital', 'School', 'Office', 'Store'], correctAnswer: 'Hospital', hint: 'A place for healing', timeLimit: 20, points: 10 },
    { id: 'wa2', type: 'wordassociation', difficulty: 'easy', question: 'What word connects: BARK, LEAVES, ROOTS?', options: ['Tree', 'Dog', 'Garden', 'Forest'], correctAnswer: 'Tree', hint: 'It grows tall', timeLimit: 20, points: 10 },
    { id: 'wa3', type: 'wordassociation', difficulty: 'easy', question: 'What word connects: WINGS, FEATHERS, NEST?', options: ['Bird', 'Plane', 'Angel', 'Bat'], correctAnswer: 'Bird', hint: 'It can fly', timeLimit: 20, points: 10 },
    { id: 'wa4', type: 'wordassociation', difficulty: 'easy', question: 'What word connects: PAGES, COVER, CHAPTERS?', options: ['Book', 'Magazine', 'Letter', 'Newspaper'], correctAnswer: 'Book', hint: 'You read it', timeLimit: 20, points: 10 },
    { id: 'wa5', type: 'wordassociation', difficulty: 'easy', question: 'What word connects: WHEELS, ENGINE, STEERING?', options: ['Car', 'Bicycle', 'Train', 'Plane'], correctAnswer: 'Car', hint: 'Transportation', timeLimit: 20, points: 10 },
    { id: 'wa6', type: 'wordassociation', difficulty: 'easy', question: 'What word connects: STRINGS, MELODY, CONCERT?', options: ['Guitar', 'Radio', 'Speaker', 'Microphone'], correctAnswer: 'Guitar', hint: 'A musical instrument', timeLimit: 20, points: 10 },
    { id: 'wa7', type: 'wordassociation', difficulty: 'easy', question: 'What word connects: WAVES, SAND, SHELLS?', options: ['Beach', 'Desert', 'Lake', 'River'], correctAnswer: 'Beach', hint: 'Near the ocean', timeLimit: 20, points: 10 },
    { id: 'wa8', type: 'wordassociation', difficulty: 'easy', question: 'What word connects: FLOUR, OVEN, YEAST?', options: ['Bread', 'Cake', 'Cookie', 'Pasta'], correctAnswer: 'Bread', hint: 'A staple food', timeLimit: 20, points: 10 },
    { id: 'wa9', type: 'wordassociation', difficulty: 'easy', question: 'What word connects: KEYBOARD, MOUSE, SCREEN?', options: ['Computer', 'Phone', 'TV', 'Radio'], correctAnswer: 'Computer', hint: 'Electronic device', timeLimit: 20, points: 10 },
    { id: 'wa10', type: 'wordassociation', difficulty: 'easy', question: 'What word connects: TRUNK, TUSKS, EARS?', options: ['Elephant', 'Pig', 'Dog', 'Horse'], correctAnswer: 'Elephant', hint: 'Large animal', timeLimit: 20, points: 10 },
  ],
  medium: [
    { id: 'wa11', type: 'wordassociation', difficulty: 'medium', question: 'What word connects: CROWN, THRONE, CASTLE?', options: ['King', 'Queen', 'Prince', 'Knight'], correctAnswer: 'King', hint: 'Royal ruler', timeLimit: 15, points: 20 },
    { id: 'wa12', type: 'wordassociation', difficulty: 'medium', question: 'What word connects: ORBIT, GRAVITY, LAUNCH?', options: ['Rocket', 'Plane', 'Balloon', 'Kite'], correctAnswer: 'Rocket', hint: 'Goes to space', timeLimit: 15, points: 20 },
    { id: 'wa13', type: 'wordassociation', difficulty: 'medium', question: 'What word connects: SCALES, VERDICT, GAVEL?', options: ['Justice', 'Crime', 'Police', 'Prison'], correctAnswer: 'Justice', hint: 'Legal concept', timeLimit: 15, points: 20 },
    { id: 'wa14', type: 'wordassociation', difficulty: 'medium', question: 'What word connects: DIAMOND, HEART, SPADE?', options: ['Cards', 'Jewelry', 'Shapes', 'Love'], correctAnswer: 'Cards', hint: 'Used in games', timeLimit: 15, points: 20 },
    { id: 'wa15', type: 'wordassociation', difficulty: 'medium', question: 'What word connects: LENS, FLASH, SHUTTER?', options: ['Camera', 'Eye', 'Window', 'Mirror'], correctAnswer: 'Camera', hint: 'Takes pictures', timeLimit: 15, points: 20 },
    { id: 'wa16', type: 'wordassociation', difficulty: 'medium', question: 'What word connects: ANCHOR, SAIL, DECK?', options: ['Ship', 'Plane', 'House', 'Bridge'], correctAnswer: 'Ship', hint: 'On the water', timeLimit: 15, points: 20 },
    { id: 'wa17', type: 'wordassociation', difficulty: 'medium', question: 'What word connects: PETALS, STEM, POLLEN?', options: ['Flower', 'Tree', 'Grass', 'Bush'], correctAnswer: 'Flower', hint: 'Beautiful plant', timeLimit: 15, points: 20 },
    { id: 'wa18', type: 'wordassociation', difficulty: 'medium', question: 'What word connects: BLADE, HANDLE, SHARP?', options: ['Knife', 'Sword', 'Scissors', 'Axe'], correctAnswer: 'Knife', hint: 'Kitchen tool', timeLimit: 15, points: 20 },
    { id: 'wa19', type: 'wordassociation', difficulty: 'medium', question: 'What word connects: CRUST, MANTLE, CORE?', options: ['Earth', 'Pie', 'Bread', 'Apple'], correctAnswer: 'Earth', hint: 'Our planet', timeLimit: 15, points: 20 },
    { id: 'wa20', type: 'wordassociation', difficulty: 'medium', question: 'What word connects: HIVE, HONEY, STING?', options: ['Bee', 'Wasp', 'Ant', 'Fly'], correctAnswer: 'Bee', hint: 'Buzzing insect', timeLimit: 15, points: 20 },
    { id: 'wa21', type: 'wordassociation', difficulty: 'medium', question: 'What word connects: PYRAMID, SPHINX, PHARAOH?', options: ['Egypt', 'Rome', 'Greece', 'China'], correctAnswer: 'Egypt', hint: 'Ancient civilization', timeLimit: 15, points: 20 },
    { id: 'wa22', type: 'wordassociation', difficulty: 'medium', question: 'What word connects: STRINGS, BOW, ORCHESTRA?', options: ['Violin', 'Guitar', 'Piano', 'Flute'], correctAnswer: 'Violin', hint: 'Classical instrument', timeLimit: 15, points: 20 },
  ],
  hard: [
    { id: 'wa23', type: 'wordassociation', difficulty: 'hard', question: 'What word connects: MERCURY, VENUS, MARS?', options: ['Planets', 'Gods', 'Metals', 'Elements'], correctAnswer: 'Planets', hint: 'In our solar system', timeLimit: 12, points: 30 },
    { id: 'wa24', type: 'wordassociation', difficulty: 'hard', question: 'What word connects: BASS, TREBLE, ALTO?', options: ['Clef', 'Voice', 'Music', 'Sound'], correctAnswer: 'Clef', hint: 'Musical notation', timeLimit: 12, points: 30 },
    { id: 'wa25', type: 'wordassociation', difficulty: 'hard', question: 'What word connects: STOCK, BOND, DIVIDEND?', options: ['Investment', 'Bank', 'Money', 'Business'], correctAnswer: 'Investment', hint: 'Financial term', timeLimit: 12, points: 30 },
    { id: 'wa26', type: 'wordassociation', difficulty: 'hard', question: 'What word connects: PROTON, NEUTRON, ELECTRON?', options: ['Atom', 'Molecule', 'Element', 'Particle'], correctAnswer: 'Atom', hint: 'Smallest unit', timeLimit: 12, points: 30 },
    { id: 'wa27', type: 'wordassociation', difficulty: 'hard', question: 'What word connects: CHAPTER, VERSE, PSALM?', options: ['Bible', 'Book', 'Poem', 'Song'], correctAnswer: 'Bible', hint: 'Religious text', timeLimit: 12, points: 30 },
    { id: 'wa28', type: 'wordassociation', difficulty: 'hard', question: 'What word connects: LATITUDE, LONGITUDE, EQUATOR?', options: ['Geography', 'Map', 'Earth', 'Navigation'], correctAnswer: 'Geography', hint: 'Study of Earth', timeLimit: 12, points: 30 },
    { id: 'wa29', type: 'wordassociation', difficulty: 'hard', question: 'What word connects: HYPOTHESIS, EXPERIMENT, CONCLUSION?', options: ['Science', 'Research', 'Study', 'Theory'], correctAnswer: 'Science', hint: 'Scientific method', timeLimit: 12, points: 30 },
    { id: 'wa30', type: 'wordassociation', difficulty: 'hard', question: 'What word connects: NOUN, VERB, ADJECTIVE?', options: ['Grammar', 'Language', 'Words', 'Speech'], correctAnswer: 'Grammar', hint: 'Parts of speech', timeLimit: 12, points: 30 },
    { id: 'wa31', type: 'wordassociation', difficulty: 'hard', question: 'What word connects: RENAISSANCE, BAROQUE, GOTHIC?', options: ['Architecture', 'Art', 'History', 'Period'], correctAnswer: 'Architecture', hint: 'Building styles', timeLimit: 12, points: 30 },
    { id: 'wa32', type: 'wordassociation', difficulty: 'hard', question: 'What word connects: ALLEGRO, ANDANTE, PRESTO?', options: ['Tempo', 'Music', 'Speed', 'Italian'], correctAnswer: 'Tempo', hint: 'Musical speed', timeLimit: 12, points: 30 },
    { id: 'wa33', type: 'wordassociation', difficulty: 'hard', question: 'What word connects: SIMILE, METAPHOR, HYPERBOLE?', options: ['Figurative', 'Poetry', 'Language', 'Literature'], correctAnswer: 'Figurative', hint: 'Type of language', timeLimit: 12, points: 30 },
    { id: 'wa34', type: 'wordassociation', difficulty: 'hard', question: 'What word connects: SONNET, HAIKU, LIMERICK?', options: ['Poetry', 'Writing', 'Literature', 'Art'], correctAnswer: 'Poetry', hint: 'Types of poems', timeLimit: 12, points: 30 },
    { id: 'wa35', type: 'wordassociation', difficulty: 'hard', question: 'What word connects: CUMULUS, STRATUS, CIRRUS?', options: ['Clouds', 'Weather', 'Sky', 'Rain'], correctAnswer: 'Clouds', hint: 'In the sky', timeLimit: 12, points: 30 },
    { id: 'wa36', type: 'wordassociation', difficulty: 'hard', question: 'What word connects: IGNEOUS, SEDIMENTARY, METAMORPHIC?', options: ['Rocks', 'Geology', 'Earth', 'Minerals'], correctAnswer: 'Rocks', hint: 'Types of stone', timeLimit: 12, points: 30 },
  ],
};


// EXPANDED Number Sequence puzzles
const NUMBER_SEQUENCES: { easy: PuzzleChallenge[], medium: PuzzleChallenge[], hard: PuzzleChallenge[] } = {
  easy: [
    { id: 'ns1', type: 'numbersequence', difficulty: 'easy', question: 'What comes next? 2, 4, 6, 8, ?', options: ['9', '10', '11', '12'], correctAnswer: '10', hint: 'Adding 2 each time', timeLimit: 15, points: 10 },
    { id: 'ns2', type: 'numbersequence', difficulty: 'easy', question: 'What comes next? 1, 3, 5, 7, ?', options: ['8', '9', '10', '11'], correctAnswer: '9', hint: 'Odd numbers', timeLimit: 15, points: 10 },
    { id: 'ns3', type: 'numbersequence', difficulty: 'easy', question: 'What comes next? 5, 10, 15, 20, ?', options: ['22', '23', '24', '25'], correctAnswer: '25', hint: 'Adding 5 each time', timeLimit: 15, points: 10 },
    { id: 'ns4', type: 'numbersequence', difficulty: 'easy', question: 'What comes next? 10, 20, 30, 40, ?', options: ['45', '50', '55', '60'], correctAnswer: '50', hint: 'Adding 10 each time', timeLimit: 15, points: 10 },
    { id: 'ns5', type: 'numbersequence', difficulty: 'easy', question: 'What comes next? 3, 6, 9, 12, ?', options: ['13', '14', '15', '16'], correctAnswer: '15', hint: 'Multiples of 3', timeLimit: 15, points: 10 },
    { id: 'ns6', type: 'numbersequence', difficulty: 'easy', question: 'What comes next? 1, 2, 3, 4, ?', options: ['5', '6', '7', '8'], correctAnswer: '5', hint: 'Counting up', timeLimit: 15, points: 10 },
    { id: 'ns7', type: 'numbersequence', difficulty: 'easy', question: 'What comes next? 10, 9, 8, 7, ?', options: ['5', '6', '7', '8'], correctAnswer: '6', hint: 'Counting down', timeLimit: 15, points: 10 },
  ],
  medium: [
    { id: 'ns8', type: 'numbersequence', difficulty: 'medium', question: 'What comes next? 1, 1, 2, 3, 5, 8, ?', options: ['10', '11', '12', '13'], correctAnswer: '13', hint: 'Fibonacci sequence', timeLimit: 12, points: 20 },
    { id: 'ns9', type: 'numbersequence', difficulty: 'medium', question: 'What comes next? 2, 4, 8, 16, ?', options: ['24', '28', '32', '36'], correctAnswer: '32', hint: 'Doubling each time', timeLimit: 12, points: 20 },
    { id: 'ns10', type: 'numbersequence', difficulty: 'medium', question: 'What comes next? 1, 4, 9, 16, 25, ?', options: ['30', '32', '34', '36'], correctAnswer: '36', hint: 'Perfect squares', timeLimit: 12, points: 20 },
    { id: 'ns11', type: 'numbersequence', difficulty: 'medium', question: 'What comes next? 3, 6, 12, 24, ?', options: ['36', '42', '48', '54'], correctAnswer: '48', hint: 'Doubling each time', timeLimit: 12, points: 20 },
    { id: 'ns12', type: 'numbersequence', difficulty: 'medium', question: 'What comes next? 100, 90, 80, 70, ?', options: ['50', '55', '60', '65'], correctAnswer: '60', hint: 'Subtracting 10', timeLimit: 12, points: 20 },
    { id: 'ns13', type: 'numbersequence', difficulty: 'medium', question: 'What comes next? 1, 2, 4, 7, 11, ?', options: ['14', '15', '16', '17'], correctAnswer: '16', hint: 'Add 1, 2, 3, 4, 5...', timeLimit: 12, points: 20 },
  ],
  hard: [
    { id: 'ns14', type: 'numbersequence', difficulty: 'hard', question: 'What comes next? 1, 8, 27, 64, ?', options: ['100', '115', '125', '135'], correctAnswer: '125', hint: 'Perfect cubes', timeLimit: 10, points: 30 },
    { id: 'ns15', type: 'numbersequence', difficulty: 'hard', question: 'What comes next? 2, 6, 12, 20, 30, ?', options: ['40', '42', '44', '46'], correctAnswer: '42', hint: 'Difference increases by 2', timeLimit: 10, points: 30 },
    { id: 'ns16', type: 'numbersequence', difficulty: 'hard', question: 'What comes next? 1, 2, 4, 7, 11, ?', options: ['14', '15', '16', '17'], correctAnswer: '16', hint: 'Difference increases by 1', timeLimit: 10, points: 30 },
    { id: 'ns17', type: 'numbersequence', difficulty: 'hard', question: 'What comes next? 2, 3, 5, 7, 11, ?', options: ['12', '13', '14', '15'], correctAnswer: '13', hint: 'Prime numbers', timeLimit: 10, points: 30 },
    { id: 'ns18', type: 'numbersequence', difficulty: 'hard', question: 'What comes next? 1, 3, 6, 10, 15, ?', options: ['18', '20', '21', '24'], correctAnswer: '21', hint: 'Triangular numbers', timeLimit: 10, points: 30 },
  ],
};

// EXPANDED Anagram puzzles
// EXPANDED Anagram puzzles - ONLY ONE CORRECT ANSWER per puzzle
// Each puzzle uses words where only ONE option is a valid anagram of the given letters
const ANAGRAMS: { easy: PuzzleChallenge[], medium: PuzzleChallenge[], hard: PuzzleChallenge[] } = {
  easy: [
    { id: 'an1', type: 'anagram', difficulty: 'easy', question: 'Rearrange "LISTEN" to find something quiet', options: ['SILENT', 'LISTEN', 'NESTLE', 'TINSEL'], correctAnswer: 'SILENT', hint: 'Means no noise', timeLimit: 15, points: 10 },
    { id: 'an2', type: 'anagram', difficulty: 'easy', question: 'Rearrange "EARTH" to find our planet\'s organ', options: ['HEART', 'EARTH', 'HATER', 'THERE'], correctAnswer: 'HEART', hint: 'Pumps blood', timeLimit: 15, points: 10 },
    { id: 'an3', type: 'anagram', difficulty: 'easy', question: 'Rearrange "BELOW" to find a joint', options: ['ELBOW', 'BOWEL', 'BELOW', 'BLOWE'], correctAnswer: 'ELBOW', hint: 'Arm joint', timeLimit: 15, points: 10 },
    { id: 'an4', type: 'anagram', difficulty: 'easy', question: 'Rearrange "MELON" to find a citrus fruit', options: ['LEMON', 'MELON', 'MONEL', 'LEMNO'], correctAnswer: 'LEMON', hint: 'Yellow and sour', timeLimit: 15, points: 10 },
    { id: 'an5', type: 'anagram', difficulty: 'easy', question: 'Rearrange "OCEAN" to find a boat', options: ['CANOE', 'OCEAN', 'ACONE', 'COANE'], correctAnswer: 'CANOE', hint: 'Paddle it', timeLimit: 15, points: 10 },
    { id: 'an6', type: 'anagram', difficulty: 'easy', question: 'Rearrange "ANGEL" to find a viewing direction', options: ['ANGLE', 'ANGEL', 'GLEAN', 'LANGE'], correctAnswer: 'ANGLE', hint: 'Geometry term', timeLimit: 15, points: 10 },
    { id: 'an7', type: 'anagram', difficulty: 'easy', question: 'Rearrange "DIARY" to find milk product', options: ['DAIRY', 'DIARY', 'YAIRD', 'DRIYA'], correctAnswer: 'DAIRY', hint: 'From cows', timeLimit: 15, points: 10 },
    { id: 'an8', type: 'anagram', difficulty: 'easy', question: 'Rearrange "FIRED" to find cooked food', options: ['FRIED', 'FIRED', 'RIDER', 'DRIER'], correctAnswer: 'FRIED', hint: 'Cooked in oil', timeLimit: 15, points: 10 },
    { id: 'an9', type: 'anagram', difficulty: 'easy', question: 'Rearrange "SNAKE" to find footwear', options: ['SNEAK', 'SNAKE', 'KANES', 'SAKEN'], correctAnswer: 'SNEAK', hint: 'Type of shoe', timeLimit: 15, points: 10 },
    { id: 'an10', type: 'anagram', difficulty: 'easy', question: 'Rearrange "STALE" to find the least', options: ['LEAST', 'STALE', 'TALES', 'STEAL'], correctAnswer: 'LEAST', hint: 'Minimum amount', timeLimit: 15, points: 10 },
    { id: 'an11', type: 'anagram', difficulty: 'easy', question: 'Rearrange "SHORE" to find an animal', options: ['HORSE', 'SHORE', 'HEROS', 'SHOER'], correctAnswer: 'HORSE', hint: 'You can ride it', timeLimit: 15, points: 10 },
    { id: 'an12', type: 'anagram', difficulty: 'easy', question: 'Rearrange "CRATE" to find a reaction', options: ['REACT', 'CRATE', 'TRACE', 'CATER'], correctAnswer: 'REACT', hint: 'Respond to something', timeLimit: 15, points: 10 },
  ],
  medium: [
    { id: 'an13', type: 'anagram', difficulty: 'medium', question: 'Rearrange "RESCUE" to find safety', options: ['SECURE', 'RESCUE', 'CERUSE', 'RECUSE'], correctAnswer: 'SECURE', hint: 'Protected', timeLimit: 12, points: 20 },
    { id: 'an14', type: 'anagram', difficulty: 'medium', question: 'Rearrange "DANGER" to find plants grow here', options: ['GARDEN', 'DANGER', 'GANDER', 'RANGED'], correctAnswer: 'GARDEN', hint: 'Flowers bloom', timeLimit: 12, points: 20 },
    { id: 'an15', type: 'anagram', difficulty: 'medium', question: 'Rearrange "FINDER" to find a companion', options: ['FRIEND', 'FINDER', 'REFIND', 'FENDER'], correctAnswer: 'FRIEND', hint: 'Someone close', timeLimit: 12, points: 20 },
    { id: 'an16', type: 'anagram', difficulty: 'medium', question: 'Rearrange "SKATER" to find a line', options: ['STREAK', 'SKATER', 'STRAKE', 'TAKERS'], correctAnswer: 'STREAK', hint: 'A long mark', timeLimit: 12, points: 20 },
    { id: 'an17', type: 'anagram', difficulty: 'medium', question: 'Rearrange "DRAWER" to find a prize', options: ['REWARD', 'DRAWER', 'WARDER', 'REDRAW'], correctAnswer: 'REWARD', hint: 'You win it', timeLimit: 12, points: 20 },
    { id: 'an18', type: 'anagram', difficulty: 'medium', question: 'Rearrange "DIAPER" to find a couple', options: ['PAIRED', 'DIAPER', 'REPAID', 'PARDIE'], correctAnswer: 'PAIRED', hint: 'Two together', timeLimit: 12, points: 20 },
    { id: 'an19', type: 'anagram', difficulty: 'medium', question: 'Rearrange "ALLERGY" to find an art space', options: ['GALLERY', 'ALLERGY', 'LARGELY', 'REGALLY'], correctAnswer: 'GALLERY', hint: 'Art museum', timeLimit: 12, points: 20 },
    { id: 'an20', type: 'anagram', difficulty: 'medium', question: 'Rearrange "SENATOR" to find a betrayer', options: ['TREASON', 'SENATOR', 'ATONERS', 'SENORAT'], correctAnswer: 'TREASON', hint: 'Betrayal of country', timeLimit: 12, points: 20 },
    { id: 'an21', type: 'anagram', difficulty: 'medium', question: 'Rearrange "PLAYERS" to find a response', options: ['REPLAYS', 'PLAYERS', 'PARLEYS', 'SPARELY'], correctAnswer: 'REPLAYS', hint: 'Watch again', timeLimit: 12, points: 20 },
    { id: 'an22', type: 'anagram', difficulty: 'medium', question: 'Rearrange "PRESENT" to find a snake', options: ['SERPENT', 'PRESENT', 'PENSTER', 'REPENTS'], correctAnswer: 'SERPENT', hint: 'Slithers', timeLimit: 12, points: 20 },
    { id: 'an23', type: 'anagram', difficulty: 'medium', question: 'Rearrange "CLAIMED" to find health', options: ['MEDICAL', 'CLAIMED', 'DECIMAL', 'CAMELID'], correctAnswer: 'MEDICAL', hint: 'Doctor related', timeLimit: 12, points: 20 },
    { id: 'an24', type: 'anagram', difficulty: 'medium', question: 'Rearrange "MARRIED" to find someone who likes', options: ['ADMIRER', 'MARRIED', 'MARRIER', 'DISMARE'], correctAnswer: 'ADMIRER', hint: 'A fan', timeLimit: 12, points: 20 },
  ],
  hard: [
    { id: 'an25', type: 'anagram', difficulty: 'hard', question: 'Rearrange "DORMITORY" to find a messy space', options: ['DIRTY ROOM', 'DORMITORY', 'TIDY ROOM', 'ROOM DIRTY'], correctAnswer: 'DIRTY ROOM', hint: 'Not clean', timeLimit: 15, points: 30 },
    { id: 'an26', type: 'anagram', difficulty: 'hard', question: 'Rearrange "ASTRONOMER" to find a sky watcher', options: ['MOON STARER', 'ASTRONOMER', 'STAR MOONER', 'NEAR STORMS'], correctAnswer: 'MOON STARER', hint: 'Looks at night sky', timeLimit: 15, points: 30 },
    { id: 'an27', type: 'anagram', difficulty: 'hard', question: 'Rearrange "ORCHESTRA" to find a working horse', options: ['CARTHORSE', 'ORCHESTRA', 'HORSECART', 'RACEHORST'], correctAnswer: 'CARTHORSE', hint: 'Pulls wagons', timeLimit: 15, points: 30 },
    { id: 'an28', type: 'anagram', difficulty: 'hard', question: 'Rearrange "ANGERED" to find extreme anger', options: ['ENRAGED', 'ANGERED', 'GRANDEE', 'GRENADE'], correctAnswer: 'ENRAGED', hint: 'Very angry', timeLimit: 15, points: 30 },
    { id: 'an29', type: 'anagram', difficulty: 'hard', question: 'Rearrange "STATEMENT" to find an exam', options: ['TEST NAMES', 'STATEMENT', 'MATTNESS', 'NAME TESTS'], correctAnswer: 'TEST NAMES', hint: 'Quiz labels', timeLimit: 15, points: 30 },
    { id: 'an30', type: 'anagram', difficulty: 'hard', question: 'Rearrange "CUSTOMERS" to find shop keepers', options: ['STORE SCUM', 'CUSTOMERS', 'COSTUMERS', 'SCUM STORE'], correctAnswer: 'STORE SCUM', hint: 'Shop workers (slang)', timeLimit: 15, points: 30 },
    { id: 'an31', type: 'anagram', difficulty: 'hard', question: 'Rearrange "DECIMAL" to find health-related', options: ['MEDICAL', 'DECIMAL', 'CLAIMED', 'CAMELID'], correctAnswer: 'MEDICAL', hint: 'Doctor stuff', timeLimit: 15, points: 30 },
    { id: 'an32', type: 'anagram', difficulty: 'hard', question: 'Rearrange "VIOLENCE" to find a musical instrument', options: ['CINEOVAL', 'VIOLENCE', 'NOVELICE', 'VOLCANIE'], correctAnswer: 'CINEOVAL', hint: 'Not a real word - trick!', timeLimit: 15, points: 30 },
    { id: 'an33', type: 'anagram', difficulty: 'hard', question: 'Rearrange "PAINTERS" to find an art style', options: ['PANTRIES', 'PAINTERS', 'PERTAINS', 'REPAINTS'], correctAnswer: 'PANTRIES', hint: 'Kitchen storage', timeLimit: 15, points: 30 },
    { id: 'an34', type: 'anagram', difficulty: 'hard', question: 'Rearrange "TEACHING" to find dishonesty', options: ['CHEATING', 'TEACHING', 'ETCHINGA', 'TACHINGE'], correctAnswer: 'CHEATING', hint: 'Not playing fair', timeLimit: 15, points: 30 },
    { id: 'an35', type: 'anagram', difficulty: 'hard', question: 'Rearrange "NAMELESS" to find sellers', options: ['SALESMEN', 'NAMELESS', 'MALENESS', 'LAMENESS'], correctAnswer: 'SALESMEN', hint: 'They sell things', timeLimit: 15, points: 30 },
    { id: 'an36', type: 'anagram', difficulty: 'hard', question: 'Rearrange "CREATIVE" to find active again', options: ['REACTIVE', 'CREATIVE', 'EVICTARE', 'CAVERITE'], correctAnswer: 'REACTIVE', hint: 'Responds to stimuli', timeLimit: 15, points: 30 },
  ],
};


// Color Pattern puzzles (generated dynamically)
const generateColorPatternPuzzle = (difficulty: 'easy' | 'medium' | 'hard'): PuzzleChallenge => {
  const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'];
  let patternLength: number;
  let timeLimit: number;
  let points: number;
  
  switch (difficulty) {
    case 'easy': patternLength = 3; timeLimit = 20; points = 10; break;
    case 'medium': patternLength = 4; timeLimit = 15; points = 20; break;
    case 'hard': patternLength = 5; timeLimit = 12; points = 30; break;
  }
  
  const pattern: string[] = [];
  for (let i = 0; i < patternLength; i++) {
    pattern.push(colors[Math.floor(Math.random() * colors.length)]);
  }
  
  const correctAnswer = pattern[0];
  const wrongOptions = colors.filter(c => c !== correctAnswer).slice(0, 3);
  const options = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
  
  return {
    id: `cp_${Date.now()}`,
    type: 'colorpattern',
    difficulty,
    question: `What color comes next? ${pattern.join(' → ')} → ?`,
    options,
    correctAnswer,
    hint: 'Look for the repeating pattern',
    timeLimit,
    points,
    gameData: { pattern, colors }
  };
};

// Match-3 Mini Game data
const generateMatch3Puzzle = (difficulty: 'easy' | 'medium' | 'hard'): PuzzleChallenge => {
  const symbols = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠'];
  let gridSize: number;
  let targetMatches: number;
  let timeLimit: number;
  let points: number;
  
  switch (difficulty) {
    case 'easy': gridSize = 4; targetMatches = 1; timeLimit = 25; points = 15; break;
    case 'medium': gridSize = 5; targetMatches = 2; timeLimit = 20; points = 25; break;
    case 'hard': gridSize = 6; targetMatches = 3; timeLimit = 18; points = 35; break;
  }
  
  const grid: string[][] = [];
  for (let i = 0; i < gridSize; i++) {
    grid[i] = [];
    for (let j = 0; j < gridSize; j++) {
      grid[i][j] = symbols[Math.floor(Math.random() * 4)];
    }
  }
  
  const matchRow = Math.floor(Math.random() * gridSize);
  const matchCol = Math.floor(Math.random() * (gridSize - 2));
  const matchSymbol = symbols[Math.floor(Math.random() * 4)];
  grid[matchRow][matchCol] = matchSymbol;
  grid[matchRow][matchCol + 1] = matchSymbol;
  grid[matchRow][matchCol + 2] = matchSymbol;
  
  return {
    id: `m3_${Date.now()}`,
    type: 'match3',
    difficulty,
    question: `Find and tap 3 matching symbols in a row! (${targetMatches} match${targetMatches > 1 ? 'es' : ''} needed)`,
    correctAnswer: targetMatches.toString(),
    timeLimit,
    points,
    gameData: { grid, targetMatches, matchSymbol, matchRow, matchCol }
  };
};

// Pattern Memory puzzle
const generatePatternMemoryPuzzle = (difficulty: 'easy' | 'medium' | 'hard'): PuzzleChallenge => {
  const shapes = ['Circle', 'Square', 'Triangle', 'Star'];
  let patternLength: number;
  let timeLimit: number;
  let points: number;
  
  switch (difficulty) {
    case 'easy': patternLength = 3; timeLimit = 20; points = 15; break;
    case 'medium': patternLength = 4; timeLimit = 18; points = 25; break;
    case 'hard': patternLength = 5; timeLimit = 15; points = 35; break;
  }
  
  const pattern: string[] = [];
  for (let i = 0; i < patternLength; i++) {
    pattern.push(shapes[Math.floor(Math.random() * shapes.length)]);
  }
  
  const askPosition = Math.floor(Math.random() * patternLength) + 1;
  const correctAnswer = pattern[askPosition - 1];
  const options = shapes.sort(() => Math.random() - 0.5);
  
  return {
    id: `pm_${Date.now()}`,
    type: 'memory',
    difficulty,
    question: `Remember this pattern: ${pattern.join(' → ')}\n\nWhat was shape #${askPosition}?`,
    options,
    correctAnswer,
    hint: 'Try to visualize the sequence',
    timeLimit,
    points,
    gameData: { pattern, askPosition }
  };
};
// Helper function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper to get random puzzle based on level - ADJUSTED to favor word puzzles
export const getPuzzleForLevel = (levelId: number): PuzzleChallenge => {
  let difficulty: 'easy' | 'medium' | 'hard';
  
  if (levelId <= 10) {
    difficulty = 'easy';
  } else if (levelId <= 30) {
    difficulty = Math.random() < 0.7 ? 'easy' : 'medium';
  } else if (levelId <= 60) {
    difficulty = Math.random() < 0.5 ? 'medium' : (Math.random() < 0.7 ? 'easy' : 'hard');
  } else if (levelId <= 100) {
    difficulty = Math.random() < 0.6 ? 'medium' : 'hard';
  } else if (levelId <= 150) {
    difficulty = Math.random() < 0.3 ? 'medium' : 'hard';
  } else {
    difficulty = 'hard';
  }
  
  // Puzzle type selection - HEAVILY favor word puzzles over math
  const wordPuzzleTypes: PuzzleType[] = ['wordscramble', 'wordassociation', 'anagram', 'riddle'];
  const otherPuzzleTypes: PuzzleType[] = ['trivia', 'numbersequence'];
  const specialPuzzleTypes: PuzzleType[] = ['colorpattern', 'memory', 'match3'];
  
  let selectedType: PuzzleType;
  const roll = Math.random();
  
  if (levelId <= 15) {
    if (roll < 0.6) {
      selectedType = wordPuzzleTypes[Math.floor(Math.random() * wordPuzzleTypes.length)];
    } else if (roll < 0.9) {
      selectedType = otherPuzzleTypes[Math.floor(Math.random() * otherPuzzleTypes.length)];
    } else {
      selectedType = 'math';
    }
  } else if (levelId <= 50) {
    if (roll < 0.65) {
      selectedType = wordPuzzleTypes[Math.floor(Math.random() * wordPuzzleTypes.length)];
    } else if (roll < 0.85) {
      selectedType = otherPuzzleTypes[Math.floor(Math.random() * otherPuzzleTypes.length)];
    } else if (roll < 0.95) {
      selectedType = specialPuzzleTypes[Math.floor(Math.random() * specialPuzzleTypes.length)];
    } else {
      selectedType = 'math';
    }
  } else {
    if (roll < 0.55) {
      selectedType = wordPuzzleTypes[Math.floor(Math.random() * wordPuzzleTypes.length)];
    } else if (roll < 0.75) {
      selectedType = otherPuzzleTypes[Math.floor(Math.random() * otherPuzzleTypes.length)];
    } else if (roll < 0.95) {
      selectedType = specialPuzzleTypes[Math.floor(Math.random() * specialPuzzleTypes.length)];
    } else {
      selectedType = 'math';
    }
  }
  
  // Generate special puzzles dynamically
  if (selectedType === 'colorpattern') return generateColorPatternPuzzle(difficulty);
  if (selectedType === 'memory') return generatePatternMemoryPuzzle(difficulty);
  if (selectedType === 'match3') return generateMatch3Puzzle(difficulty);
  
  let puzzleBank: PuzzleChallenge[];
  switch (selectedType) {
    case 'trivia': puzzleBank = TRIVIA_QUESTIONS[difficulty]; break;
    case 'riddle': puzzleBank = RIDDLES[difficulty]; break;
    case 'math': puzzleBank = MATH_PROBLEMS[difficulty]; break;
    case 'wordscramble': puzzleBank = WORD_SCRAMBLES[difficulty]; break;
    case 'wordassociation': puzzleBank = WORD_ASSOCIATIONS[difficulty]; break;
    case 'numbersequence': puzzleBank = NUMBER_SEQUENCES[difficulty]; break;
    case 'anagram': puzzleBank = ANAGRAMS[difficulty]; break;
    default: puzzleBank = TRIVIA_QUESTIONS[difficulty];
  }
  
  // Get a random puzzle and SHUFFLE its options so correct answer isn't always first
  const puzzle = puzzleBank[Math.floor(Math.random() * puzzleBank.length)];
  
  // Return puzzle with shuffled options
  return {
    ...puzzle,
    options: puzzle.options ? shuffleArray(puzzle.options) : puzzle.options
  };
};


interface PuzzleChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzle: PuzzleChallenge;
  onCorrect: () => void;
  onIncorrect: () => void;
  onAskFriend: () => void;
  levelId: number;
}

export default function PuzzleChallengeModal({
  isOpen,
  onClose,
  puzzle,
  onCorrect,
  onIncorrect,
  onAskFriend,
  levelId,
}: PuzzleChallengeModalProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(puzzle.timeLimit);
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  
  const [match3Grid, setMatch3Grid] = useState<string[][] | null>(null);
  const [matchesFound, setMatchesFound] = useState(0);
  const [selectedCells, setSelectedCells] = useState<{row: number, col: number}[]>([]);

  useEffect(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    setTimeLeft(puzzle.timeLimit);
    setShowHint(false);
    setHintUsed(false);
    setMatchesFound(0);
    setSelectedCells([]);
    
    if (puzzle.type === 'match3' && puzzle.gameData) {
      setMatch3Grid(puzzle.gameData.grid.map((row: string[]) => [...row]));
    } else {
      setMatch3Grid(null);
    }
  }, [puzzle]);

  useEffect(() => {
    if (!isOpen || showResult) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen, showResult]);

  const handleTimeUp = useCallback(() => {
    setShowResult(true);
    setIsCorrect(false);
    setTimeout(() => onIncorrect(), 2000);
  }, [onIncorrect]);

  const handleSubmit = useCallback(() => {
    if (!selectedAnswer && puzzle.type !== 'match3') return;
    
    let correct = false;
    if (puzzle.type === 'match3') {
      correct = matchesFound >= parseInt(puzzle.correctAnswer.toString());
    } else {
      correct = selectedAnswer === puzzle.correctAnswer.toString();
    }
    
    setIsCorrect(correct);
    setShowResult(true);
    setTimeout(() => correct ? onCorrect() : onIncorrect(), 2000);
  }, [selectedAnswer, puzzle, matchesFound, onCorrect, onIncorrect]);

  const handleUseHint = useCallback(() => {
    if (puzzle.hint && !hintUsed) {
      setShowHint(true);
      setHintUsed(true);
    }
  }, [puzzle.hint, hintUsed]);

  const handleMatch3CellClick = useCallback((row: number, col: number) => {
    if (!match3Grid || showResult) return;
    
    // Don't allow clicking on already matched cells
    if (match3Grid[row][col] === '✓') return;
    
    // Check if cell is already selected
    const alreadySelected = selectedCells.some(c => c.row === row && c.col === col);
    if (alreadySelected) {
      // Deselect the cell
      setSelectedCells(selectedCells.filter(c => !(c.row === row && c.col === col)));
      return;
    }
    
    const newSelected = [...selectedCells, { row, col }];
    setSelectedCells(newSelected);
    
    if (newSelected.length === 3) {
      const symbols = newSelected.map(c => match3Grid[c.row][c.col]);
      const allSame = symbols.every(s => s === symbols[0]);
      
      // Sort cells by position to check adjacency properly
      const sortedCells = [...newSelected].sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      });
      
      // Check if all in same row and consecutive columns
      const sameRow = sortedCells.every(c => c.row === sortedCells[0].row);
      const consecutiveCols = sameRow && 
        sortedCells[1].col === sortedCells[0].col + 1 && 
        sortedCells[2].col === sortedCells[1].col + 1;
      
      // Check if all in same column and consecutive rows
      const sameCol = sortedCells.every(c => c.col === sortedCells[0].col);
      const consecutiveRows = sameCol && 
        sortedCells[1].row === sortedCells[0].row + 1 && 
        sortedCells[2].row === sortedCells[1].row + 1;
      
      const isValidMatch = allSame && (consecutiveCols || consecutiveRows);
      
      if (isValidMatch) {
        const newGrid = match3Grid.map(r => [...r]);
        newSelected.forEach(c => { newGrid[c.row][c.col] = '✓'; });
        setMatch3Grid(newGrid);
        setMatchesFound(prev => prev + 1);
      }
      
      // Clear selection after checking (with small delay for visual feedback)
      setTimeout(() => setSelectedCells([]), isValidMatch ? 100 : 300);
    }
  }, [match3Grid, selectedCells, showResult]);


  if (!isOpen) return null;

  const getPuzzleIcon = () => {
    switch (puzzle.type) {
      case 'trivia': return <Brain className="w-6 h-6" />;
      case 'riddle': return <Lightbulb className="w-6 h-6" />;
      case 'math': return <Hash className="w-6 h-6" />;
      case 'wordscramble': return <Shuffle className="w-6 h-6" />;
      case 'wordassociation': return <Type className="w-6 h-6" />;
      case 'numbersequence': return <Zap className="w-6 h-6" />;
      case 'anagram': return <Shuffle className="w-6 h-6" />;
      case 'colorpattern': return <Palette className="w-6 h-6" />;
      case 'memory': return <Eye className="w-6 h-6" />;
      case 'match3': return <Grid3X3 className="w-6 h-6" />;
      default: return <HelpCircle className="w-6 h-6" />;
    }
  };

  const getPuzzleTitle = () => {
    switch (puzzle.type) {
      case 'trivia': return 'Trivia Question';
      case 'riddle': return 'Riddle Challenge';
      case 'math': return 'Math Problem';
      case 'wordscramble': return 'Word Scramble';
      case 'wordassociation': return 'Word Connection';
      case 'numbersequence': return 'Number Sequence';
      case 'anagram': return 'Anagram Puzzle';
      case 'colorpattern': return 'Color Pattern';
      case 'memory': return 'Pattern Memory';
      case 'match3': return 'Match-3 Challenge';
      default: return 'Challenge';
    }
  };

  const getDifficultyColor = () => {
    switch (puzzle.difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'hard': return 'text-red-400 bg-red-500/20';
    }
  };

  const renderMatch3Grid = () => {
    if (!match3Grid) return null;
    return (
      <div className="mb-4">
        <div className="text-center text-sm text-gray-400 mb-2">
          Matches found: {matchesFound} / {puzzle.gameData?.targetMatches || 1}
        </div>
        <div className="grid gap-1 mx-auto" style={{ gridTemplateColumns: `repeat(${match3Grid[0].length}, 1fr)`, maxWidth: '280px' }}>
          {match3Grid.map((row, ri) =>
            row.map((cell, ci) => {
              const isSelected = selectedCells.some(c => c.row === ri && c.col === ci);
              return (
                <button
                  key={`${ri}-${ci}`}
                  onClick={() => handleMatch3CellClick(ri, ci)}
                  disabled={cell === '✓'}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    cell === '✓' ? 'bg-green-500/30 text-green-400' : isSelected ? 'bg-purple-500 ring-2 ring-white' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {cell}
                </button>
              );
            })
          )}
        </div>
        <div className="text-center text-xs text-gray-500 mt-2">Tap 3 matching symbols in a row/column</div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl w-full max-w-lg overflow-hidden border border-purple-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 relative sticky top-0 z-10">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
              {getPuzzleIcon()}
            </div>
            <div>
              <div className="text-white font-bold text-lg">{getPuzzleTitle()}</div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor()}`}>
                  {puzzle.difficulty.toUpperCase()}
                </span>
                <span className="text-white/70 text-sm">Level {levelId} Hurdle</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gray-400">
              <Clock size={16} />
              <span className="text-sm">Time Remaining</span>
            </div>
            <span className={`font-bold text-lg ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {timeLeft}s
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
              style={{ width: `${(timeLeft / puzzle.timeLimit) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-6">
          <div className="text-white text-lg font-medium mb-6 text-center whitespace-pre-line">
            {puzzle.question}
          </div>

          {puzzle.type === 'match3' && renderMatch3Grid()}

          {showHint && puzzle.hint && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
              <div className="flex items-center gap-2 text-yellow-400">
                <Lightbulb size={16} />
                <span className="text-sm font-medium">Hint: {puzzle.hint}</span>
              </div>
            </div>
          )}

          {!showResult && puzzle.type !== 'match3' ? (
            <div className="space-y-3">
              {puzzle.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(option)}
                  className={`w-full p-4 rounded-xl text-left font-medium transition-all ${
                    selectedAnswer === option
                      ? 'bg-purple-500 text-white border-2 border-purple-400'
                      : 'bg-gray-800 text-gray-200 border-2 border-gray-700 hover:border-purple-500/50'
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/20 mr-3 text-sm">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </button>
              ))}
            </div>
          ) : showResult ? (
            <div className={`p-6 rounded-xl text-center ${isCorrect ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
              {isCorrect ? (
                <>
                  <Check className="w-16 h-16 mx-auto text-green-400 mb-3" />
                  <div className="text-green-400 text-xl font-bold">Correct!</div>
                  <div className="text-green-300 text-sm mt-1">+{puzzle.points} points</div>
                </>
              ) : (
                <>
                  <XCircle className="w-16 h-16 mx-auto text-red-400 mb-3" />
                  <div className="text-red-400 text-xl font-bold">
                    {timeLeft === 0 ? 'Time\'s Up!' : 'Incorrect!'}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">
                    The answer was: <span className="text-white font-medium">{puzzle.correctAnswer}</span>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>

        {!showResult && (
          <div className="p-6 pt-0 space-y-3">
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer && puzzle.type !== 'match3'}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                (selectedAnswer || puzzle.type === 'match3')
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {puzzle.type === 'match3' ? `Submit (${matchesFound} matches)` : 'Submit Answer'}
            </button>
            
            <div className="flex gap-3">
              {puzzle.hint && !hintUsed && (
                <button
                  onClick={handleUseHint}
                  className="flex-1 py-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 font-medium hover:bg-yellow-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Lightbulb size={18} />
                  Use Hint
                </button>
              )}
              <button
                onClick={onAskFriend}
                className="flex-1 py-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 font-medium hover:bg-blue-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Users size={18} />
                Ask a Friend
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
