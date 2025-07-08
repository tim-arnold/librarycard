-- Seed curated_genres table with enhanced genre list
-- 45 main genres: 25 fiction + 20 non-fiction
-- Based on industry-standard genre lists and current CURATED_GENRES analysis

-- First, ensure we have a system user for auto-assignments
-- Note: This assumes super admin user with id 'system' exists, or replace with actual admin user id

-- Fiction Genres (25)
INSERT OR IGNORE INTO curated_genres (name, description, created_by) VALUES
('Action & Adventure', 'Fast-paced stories featuring exciting adventures and heroic characters', 'system'),
('Children''s Literature', 'Books specifically written for children and young readers', 'system'),
('Classics', 'Timeless literary works of enduring significance and quality', 'system'),
('Comedy & Humor', 'Books intended to entertain and amuse through wit and humor', 'system'),
('Contemporary Fiction', 'Modern literary works set in the present day', 'system'),
('Crime & Mystery', 'Stories involving criminal activity, detection, and puzzle-solving', 'system'),
('Dystopian & Post-Apocalyptic', 'Fiction set in societies where life is miserable or after catastrophic events', 'system'),
('Fantasy', 'Stories featuring magical or supernatural elements and imaginary worlds', 'system'),
('Gothic & Horror', 'Dark, suspenseful stories designed to frighten, unsettle, or create suspense', 'system'),
('Graphic Novel & Comics', 'Narrative works combining visual art with text in comic format', 'system'),
('Historical Fiction', 'Stories set in the past, recreating historical periods and events', 'system'),
('Literary Fiction', 'Character-driven works emphasizing artistic expression over commercial appeal', 'system'),
('Magical Realism', 'Fiction that incorporates fantastical elements into realistic narratives', 'system'),
('Paranormal & Supernatural', 'Stories involving phenomena beyond normal scientific understanding', 'system'),
('Poetry', 'Literary works expressing emotions, ideas, or experiences through verse', 'system'),
('Psychological Thriller', 'Suspenseful stories focusing on characters'' mental and emotional states', 'system'),
('Romance', 'Stories centered around romantic relationships and love', 'system'),
('Science Fiction', 'Fiction dealing with futuristic concepts, technology, and scientific phenomena', 'system'),
('Short Stories', 'Brief fictional prose narratives', 'system'),
('Thriller & Suspense', 'Fast-paced stories designed to keep readers in suspense', 'system'),
('Urban Fantasy', 'Fantasy stories set in urban, contemporary environments', 'system'),
('War Fiction', 'Stories set during wartime or dealing with themes of warfare', 'system'),
('Western', 'Stories set in the American Old West frontier period', 'system'),
('Young Adult', 'Fiction targeted at teenage readers, typically ages 12-18', 'system'),
('LGBTQ+ Fiction', 'Stories featuring LGBTQ+ characters, themes, and experiences', 'system');

-- Non-Fiction Genres (20)
INSERT OR IGNORE INTO curated_genres (name, description, created_by) VALUES
('Art & Design', 'Books about visual arts, design principles, and creative expression', 'system'),
('Biography & Memoir', 'Life stories and personal accounts of real people', 'system'),
('Business & Economics', 'Books about business practices, economic theory, and financial matters', 'system'),
('Cooking & Food', 'Culinary guides, recipes, and food-related topics', 'system'),
('Education & Academia', 'Educational materials, teaching methods, and academic subjects', 'system'),
('Essays & Literature', 'Collections of essays and literary criticism', 'system'),
('Health & Fitness', 'Books about physical wellness, exercise, and medical topics', 'system'),
('History', 'Accounts of past events, historical analysis, and historical narratives', 'system'),
('Philosophy', 'Exploration of fundamental questions about existence, knowledge, and ethics', 'system'),
('Politics & Social Issues', 'Books about government, political theory, and social concerns', 'system'),
('Psychology', 'Studies of mind, behavior, and mental processes', 'system'),
('Reference & How-To', 'Instructional guides, manuals, and reference materials', 'system'),
('Religion & Spirituality', 'Books about faith, religious practices, and spiritual beliefs', 'system'),
('Science & Nature', 'Scientific concepts, natural phenomena, and environmental topics', 'system'),
('Self-Help & Personal Development', 'Guidance for personal improvement and life enhancement', 'system'),
('Sports & Recreation', 'Books about athletics, games, and recreational activities', 'system'),
('Technology & Computing', 'Technical topics, computer science, and digital innovation', 'system'),
('Travel & Adventure', 'Travel guides, adventure narratives, and exploration accounts', 'system'),
('True Crime', 'Real criminal cases, investigations, and justice system stories', 'system'),
('Current Events & Journalism', 'Contemporary news analysis, reportage, and journalistic works', 'system');