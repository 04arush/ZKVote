USE zkvote;

-- Insert admin user (password: 'admin123' - bcrypt hash placeholder)
INSERT INTO Admin_Users (full_name, email, password_hash) VALUES
('', '', '');

-- Insert election
INSERT INTO Elections (admin_id, title, description, start_time, end_time, on_chain_proposal_id, is_active) VALUES
(1, 'Presidential Election 2024', 'Vote for the next president', '2024-01-01 00:00:00', '2024-12-31 23:59:59', 1, TRUE);

-- Insert candidates
INSERT INTO Candidates (election_id, candidate_name, party_or_affiliation, bio, option_index, profile_image_url) VALUES
(1, 'Alice Johnson', 'Progressive Party', 'Experienced leader focused on education and healthcare reform', 0, NULL),
(1, 'Bob Smith', 'Conservative Alliance', 'Business-oriented candidate with focus on economic growth', 1, NULL),
(1, 'Carol Williams', 'Independent', 'Independent candidate advocating for environmental policies', 2, NULL);
