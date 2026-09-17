USE zkvote_db;

INSERT INTO Admin_Users (full_name, email, password_hash)
VALUES ('Arush Singh', 'admin@zkvote.local', '$2b$10$ZKUdfIMqJaYHerIJkoNrYuw0Wdv6KvR4O7gVrqcvPoPiauf169tVO');

INSERT INTO Elections (admin_id, title, description, start_time, end_time, on_chain_proposal_id, is_active)
VALUES (1, 'Student Council Election 2026', 'Annual student council vote', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 1, TRUE);

INSERT INTO Candidates (election_id, candidate_name, party_or_affiliation, bio, option_index, profile_image_url)
VALUES
  (1, 'Candidate A', 'Independent', 'Bio for candidate A', 0, NULL),
  (1, 'Candidate B', 'Independent', 'Bio for candidate B', 1, NULL),
  (1, 'Candidate C', 'Independent', 'Bio for candidate C', 2, NULL),
  (1, 'Candidate D', 'Independent', 'Bio for candidate D', 3, NULL)
