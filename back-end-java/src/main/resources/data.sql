-- Teams
INSERT INTO teams (name, country, flag_url, fifa_ranking) VALUES ('Argentina', 'Argentina', 'https://flagcdn.com/ar.svg', 1);
INSERT INTO teams (name, country, flag_url, fifa_ranking) VALUES ('France', 'France', 'https://flagcdn.com/fr.svg', 2);
INSERT INTO teams (name, country, flag_url, fifa_ranking) VALUES ('Brazil', 'Brazil', 'https://flagcdn.com/br.svg', 3);
INSERT INTO teams (name, country, flag_url, fifa_ranking) VALUES ('England', 'England', 'https://flagcdn.com/gb-eng.svg', 4);
INSERT INTO teams (name, country, flag_url, fifa_ranking) VALUES ('Portugal', 'Portugal', 'https://flagcdn.com/pt.svg', 5);
INSERT INTO teams (name, country, flag_url, fifa_ranking) VALUES ('Spain', 'Spain', 'https://flagcdn.com/es.svg', 6);
INSERT INTO teams (name, country, flag_url, fifa_ranking) VALUES ('Germany', 'Germany', 'https://flagcdn.com/de.svg', 7);
INSERT INTO teams (name, country, flag_url, fifa_ranking) VALUES ('Netherlands', 'Netherlands', 'https://flagcdn.com/nl.svg', 8);
INSERT INTO teams (name, country, flag_url, fifa_ranking) VALUES ('Morocco', 'Morocco', 'https://flagcdn.com/ma.svg', 9);
INSERT INTO teams (name, country, flag_url, fifa_ranking) VALUES ('Japan', 'Japan', 'https://flagcdn.com/jp.svg', 10);
INSERT INTO teams (name, country, flag_url, fifa_ranking) VALUES ('Senegal', 'Senegal', 'https://flagcdn.com/sn.svg', 11);
INSERT INTO teams (name, country, flag_url, fifa_ranking) VALUES ('South Korea', 'South Korea', 'https://flagcdn.com/kr.svg', 12);

-- Stadiums
INSERT INTO stadiums (name, city, capacity) VALUES ('Lusail Stadium', 'Lusail', 88966);
INSERT INTO stadiums (name, city, capacity) VALUES ('Al Bayt Stadium', 'Al Khor', 68895);
INSERT INTO stadiums (name, city, capacity) VALUES ('Khalifa International Stadium', 'Al Rayyan', 45857);
INSERT INTO stadiums (name, city, capacity) VALUES ('Stadium 974', 'Doha', 44089);
INSERT INTO stadiums (name, city, capacity) VALUES ('Education City Stadium', 'Al Rayyan', 44667);
INSERT INTO stadiums (name, city, capacity) VALUES ('Ahmed bin Ali Stadium', 'Al Rayyan', 44740);
INSERT INTO stadiums (name, city, capacity) VALUES ('Al Janoub Stadium', 'Al Wakrah', 44325);
INSERT INTO stadiums (name, city, capacity) VALUES ('Al Thumama Stadium', 'Doha', 44400);

-- Matches
INSERT INTO matches (home_team_id, away_team_id, date_time, group_name, stage, home_score, away_score, stadium_id, attendance, referee, status)
VALUES (1, 2, '2026-06-12T18:00:00', 'A', 'GROUP', 2, 2, 1, 88966, 'Daniele Orsato', 'FINISHED');
INSERT INTO matches (home_team_id, away_team_id, date_time, group_name, stage, home_score, away_score, stadium_id, attendance, referee, status)
VALUES (3, 4, '2026-06-13T21:00:00', 'B', 'GROUP', 1, 0, 2, 68895, 'Anthony Taylor', 'FINISHED');
INSERT INTO matches (home_team_id, away_team_id, date_time, group_name, stage, home_score, away_score, stadium_id, attendance, referee, status)
VALUES (5, 6, '2026-06-14T18:00:00', 'C', 'GROUP', 3, 1, 3, 45857, 'Felix Zwayer', 'FINISHED');
INSERT INTO matches (home_team_id, away_team_id, date_time, group_name, stage, home_score, away_score, stadium_id, attendance, referee, status)
VALUES (7, 8, '2026-06-15T21:00:00', 'D', 'GROUP', 0, 2, 4, 44089, 'Wilton Sampaio', 'FINISHED');
INSERT INTO matches (home_team_id, away_team_id, date_time, group_name, stage, home_score, away_score, stadium_id, attendance, referee, status)
VALUES (1, 3, '2026-06-18T18:00:00', 'A', 'GROUP', NULL, NULL, 1, NULL, NULL, 'SCHEDULED');
INSERT INTO matches (home_team_id, away_team_id, date_time, group_name, stage, home_score, away_score, stadium_id, attendance, referee, status)
VALUES (2, 4, '2026-06-19T21:00:00', 'B', 'GROUP', NULL, NULL, 5, NULL, NULL, 'SCHEDULED');

-- Goals
INSERT INTO goals (match_id, team_id, scorer, goal_minute, own_goal, penalty) VALUES (1, 1, 'Lionel Messi', 23, false, false);
INSERT INTO goals (match_id, team_id, scorer, goal_minute, own_goal, penalty) VALUES (1, 2, 'Kylian Mbappé', 41, false, false);
INSERT INTO goals (match_id, team_id, scorer, goal_minute, own_goal, penalty) VALUES (1, 1, 'Julian Alvarez', 67, false, false);
INSERT INTO goals (match_id, team_id, scorer, goal_minute, own_goal, penalty) VALUES (1, 2, 'Antoine Griezmann', 89, false, false);
INSERT INTO goals (match_id, team_id, scorer, goal_minute, own_goal, penalty) VALUES (2, 3, 'Neymar Jr', 55, false, false);
INSERT INTO goals (match_id, team_id, scorer, goal_minute, own_goal, penalty) VALUES (3, 5, 'Cristiano Ronaldo', 12, false, false);
INSERT INTO goals (match_id, team_id, scorer, goal_minute, own_goal, penalty) VALUES (3, 5, 'Bruno Fernandes', 45, false, true);
INSERT INTO goals (match_id, team_id, scorer, goal_minute, own_goal, penalty) VALUES (3, 6, 'Pedri', 67, false, false);
INSERT INTO goals (match_id, team_id, scorer, goal_minute, own_goal, penalty) VALUES (3, 5, 'Joao Felix', 82, false, false);
INSERT INTO goals (match_id, team_id, scorer, goal_minute, own_goal, penalty) VALUES (4, 8, 'Memphis Depay', 34, false, false);
INSERT INTO goals (match_id, team_id, scorer, goal_minute, own_goal, penalty) VALUES (4, 8, 'Cody Gakpo', 71, false, false);
