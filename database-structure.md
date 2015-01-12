INSERT INTO experiments (name, description, hypothesis, experimentors, trials_table) VALUES ('GM-Perceptual Learning v1.0', 'Perceptual learning experiment using grasping math. We replicate Kellman 2009, and add a condition where the answer is given by dragging terms in a GM expression.', '1) Reaction times in post-test are much lower than in pre-test. 2) Accuracy might either be high from the start, or increase. 3) Main interest: we expect that when people have to move terms, the improvement in reaction times in post-test is larger.', 'Erik Weitnauer, David Landy, Adam Datema', 'gm_pl_v1_0');

create table gm_pl_v1_0 (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  exp_id INT NOT NULL,
  subject_id VARCHAR(50) NOT NULL,
  stage VARCHAR(50) NOT NULL,
  cond VARCHAR(200),
  trial_idx INT,
  task_id INT,
  task VARCHAR(200),
  optionA VARCHAR(200),
  optionB VARCHAR(200),
  optionC VARCHAR(200),
  optionD VARCHAR(200),
  correct_answer VARCHAR(200),
  recorded_answer VARCHAR(10),
  recorded_accuracy BOOL,
  recorded_time_to_action BIGINT,
  recorded_time_to_submit BIGINT,
  recorded_action_result VARCHAR(200),
  recorded_action_count INT,
  timestamp TIMESTAMP,
  FOREIGN KEY (exp_id) REFERENCES experiments(id));

DELETE FROM gm_pl_v1.0 WHERE mturk_id="test"
