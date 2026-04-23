CREATE DATABASE IF NOT EXISTS zkvote;
USE zkvote;

CREATE TABLE Admin_Users (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Elections (
  election_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  on_chain_proposal_id BIGINT UNSIGNED NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (admin_id) REFERENCES Admin_Users(admin_id)
);

CREATE TABLE Candidates (
  candidate_id INT AUTO_INCREMENT PRIMARY KEY,
  election_id INT NOT NULL,
  candidate_name VARCHAR(150) NOT NULL,
  party_or_affiliation VARCHAR(150),
  bio TEXT,
  option_index TINYINT UNSIGNED NOT NULL,
  profile_image_url VARCHAR(255),
  FOREIGN KEY (election_id) REFERENCES Elections(election_id)
);
