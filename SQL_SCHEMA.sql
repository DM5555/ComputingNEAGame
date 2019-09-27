/*
** LAST UPDATED 27/09/2019
*/

/*MAIN USERS TABLE */
CREATE TABLE Users (
  UUID CHAR(36) NOT NULL PRIMARY KEY,
  DisplayName VARCHAR(16),
  IsAdmin BOOLEAN,
  PasswordHash CHAR(64),
  PasswordSalt CHAR(64)
);
