DROP DATABASE IF EXISTS tankgame;
CREATE DATABASE tankgame;
USE tankgame;

CREATE TABLE board (
	guildID BIGINT UNSIGNED PRIMARY KEY NOT NULL,
	locked BOOL NOT NULL DEFAULT TRUE,
    maxAP INT UNSIGNED NOT NULL DEFAULT 10,
    rolealive BIGINT UNSIGNED DEFAULT NULL,
    roledead BIGINT UNSIGNED DEFAULT NULL,
    rolewin BIGINT UNSIGNED DEFAULT NULL,
    roleallowed BIGINT UNSIGNED DEFAULT NULL,
    roleadmin BIGINT UNSIGNED DEFAULT NULL,
    w TINYINT UNSIGNED NOT NULL DEFAULT 30,
    h TINYINT UNSIGNED NOT NULL DEFAULT 18
);

CREATE TABLE tank (
	userID BIGINT UNSIGNED NOT NULL,
    guildID BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY(userID, guildId),
    FOREIGN KEY tank(guildID) REFERENCES board(guildID) ON DELETE CASCADE,
    X TINYINT UNSIGNED NOT NULL,
    Y TINYINT UNSIGNED NOT NULL,
	AP INT UNSIGNED NOT NULL DEFAULT 0,
    HP INT UNSIGNED NOT NULL DEFAULT 3 CHECK(HP BETWEEN 0 AND 3)
);

DELIMITER $$
DROP TRIGGER IF EXISTS onBoardUpdate$$
CREATE TRIGGER onBoardUpdate BEFORE UPDATE ON board FOR EACH ROW BEGIN
	IF NEW.w < OLD.w OR NEW.h < OLD.h THEN
		DELETE FROM tank WHERE X>=NEW.w OR Y>=NEW.h;
    END IF;
    IF NEW.maxAP < OLD.maxAP THEN
		UPDATE tank SET AP=LEAST(AP, NEW.maxAP);
    END IF;
END$$

DROP PROCEDURE IF EXISTS createBoard$$
CREATE PROCEDURE createBoard(gID BIGINT UNSIGNED)
BEGIN
	DECLARE EXIT HANDLER FOR 1062 SELECT 9;
	INSERT board(guildID) VALUES(gID);
    SELECT 0;
END$$

DROP PROCEDURE IF EXISTS addTank$$
CREATE PROCEDURE addTank(gID BIGINT UNSIGNED, uID BIGINT UNSIGNED)
this_proc:BEGIN
	DECLARE nw,nh,nx,ny TINYINT UNSIGNED;
    DECLARE c SMALLINT UNSIGNED;
    DECLARE islocked BOOL DEFAULT TRUE;
    IF EXISTS(SELECT 1 FROM tank WHERE guildID=gID AND userID=uID) THEN
		SELECT 2;
        LEAVE this_proc;
    END IF;
	SELECT locked,w,h INTO islocked,nw,nh FROM board WHERE guildID = gID;
    IF islocked THEN
		SELECT 1;
        LEAVE this_proc;
    END IF;
    SELECT COUNT(*) INTO c FROM tank WHERE guildID = gID;
    IF c>=nw*nh THEN
		SELECT 3;
        LEAVE this_proc;
    END IF;
    REPEAT SET nx=FLOOR(RAND()*nw), ny=FLOOR(RAND()*nh);
    UNTIL NOT EXISTS (SELECT 1 FROM tank WHERE guildID=gID AND X=nx AND Y=ny)
    END REPEAT;
    INSERT tank(userID,guildID,X,Y) VALUES (uID,gID,nx,ny);
    SELECT 0;
END$$

DROP PROCEDURE IF EXISTS removeTank$$
CREATE PROCEDURE removeTank(gID BIGINT UNSIGNED, uID BIGINT UNSIGNED)
this_proc:BEGIN
	DECLARE islocked BOOL DEFAULT NULL;
    SELECT locked INTO islocked FROM board WHERE guildID = gID;
    IF islocked IS NULL THEN
		SELECT 10;
        LEAVE this_proc;
    END IF;
    IF islocked THEN
		SELECT 1;
        LEAVE this_proc;
    END IF;
    IF NOT EXISTS(SELECT 1 FROM tank WHERE guildID=gID AND userID=uID) THEN
		SELECT 4;
        LEAVE this_proc;
    END IF;
    DELETE FROM tank WHERE guildID=gID AND userID=uID;
    SELECT 0;
END$$

DROP PROCEDURE IF EXISTS giveAP$$
CREATE PROCEDURE giveAP(gID BIGINT UNSIGNED, uID BIGINT UNSIGNED, amount INT SIGNED)
BEGIN
	DECLARE apmax INT UNSIGNED;
	SELECT maxAP INTO apmax FROM board WHERE guildID = gID;
	UPDATE tank SET AP=GREATEST(LEAST(AP+amount,apmax),0) WHERE guildID = gID AND IFNULL(userID = uID,TRUE);
    SELECT 0;
END$$

DROP PROCEDURE IF EXISTS moveTank$$
CREATE PROCEDURE moveTank(gID BIGINT UNSIGNED, uID BIGINT UNSIGNED, dX SMALLINT, dY SMALLINT)
this_proc:BEGIN
	DECLARE islocked BOOL DEFAULT NULL;
    DECLARE bw,bh TINYINT UNSIGNED;
    DECLARE nx,ny SMALLINT SIGNED DEFAULT NULL;
    DECLARE nap,health INT UNSIGNED DEFAULT 0;
    IF ABS(dX)>3 OR ABS(dY)>3 THEN
		SELECT 13;
        LEAVE this_proc;
    END IF;
    SELECT locked,w,h INTO islocked,bw,bh FROM board WHERE guildID = gID;
	IF islocked IS NULL THEN
		SELECT 10;
        LEAVE this_proc;
    END IF;
    IF NOT islocked THEN
		SELECT 15;
        LEAVE this_proc;
    END IF;
    SELECT ABS(CAST(X AS SIGNED)+dX),ABS(CAST(Y AS SIGNED)+dY),CAST(AP AS SIGNED)-1,HP INTO nx,ny,nap,health FROM tank WHERE guildID = gID AND userID = uID;
    IF nx IS NULL OR ny IS NULL OR nap IS NULL OR health IS NULL THEN
		SELECT 4;
        LEAVE this_proc;
    END IF;
    IF health <= 0 THEN
		SELECT 5;
        LEAVE this_proc;
    END IF;
    IF nap < 0 THEN
		SELECT 6;
        LEAVE this_proc;
    END IF;
    IF nx < 0 OR ny < 0 OR nx >= bw OR ny >= bh THEN
		SELECT 7;
        LEAVE this_proc;
    END IF;
    IF EXISTS (SELECT 1 FROM tank WHERE guildID=gID AND X=nx AND Y=ny AND HP>0) THEN
		SELECT 8;
		LEAVE this_proc;
    END IF;
    UPDATE tank SET X=nx, Y=ny, AP=nap WHERE guildId=gID AND userID=uID;
    SELECT 0;
END$$

DROP PROCEDURE IF EXISTS shootTank$$
CREATE PROCEDURE shootTank(gID BIGINT UNSIGNED, shooterID BIGINT UNSIGNED, targetID BIGINT UNSIGNED)
this_proc:BEGIN
    DECLARE islocked BOOLEAN DEFAULT NULL;
    DECLARE dX, dY SMALLINT SIGNED DEFAULT NULL;
    DECLARE nap,health INT SIGNED DEFAULT NULL;
    IF shooterID = targetID THEN
		SELECT 11;
        LEAVE this_proc;
    END IF;
	SELECT locked INTO islocked FROM board WHERE guildID = gID;
    IF islocked IS NULL THEN
		SELECT 10;
        LEAVE this_proc;
    END IF;
    IF NOT islocked THEN
		SELECT 15;
        LEAVE this_proc;
    END IF;
    SELECT X,Y,CAST(AP AS SIGNED)-1,HP INTO dX,dY,nap,health FROM tank WHERE guildID = gID AND userID = shooterID;
	IF dX IS NULL OR dY IS NULL OR nap IS NULL OR health IS NULL THEN
		SELECT 4;
        LEAVE this_proc;
    END IF;
    IF nap < 0 THEN
		SELECT 6;
        LEAVE this_proc;
    END IF;
    IF health <= 0 THEN
		SELECT 5;
        LEAVE this_proc;
    END IF;
    SET health = NULL;
    SELECT ABS(CAST(X AS SIGNED)-dX),ABS(CAST(Y AS SIGNED)-dY),HP INTO dX,dY,health FROM tank WHERE guildID = gID AND userID = targetID;
	IF health IS NULL THEN
		SELECT 14;
        LEAVE this_proc;
    END IF;
    IF health <= 0 THEN
		SELECT 12;
        LEAVE this_proc;
    END IF;
    IF dX>4 OR dY>4 THEN
		SELECT 13;
        LEAVE this_proc;
    END IF;
	UPDATE tank SET AP=nap WHERE guildID = gID AND userID = shooterID;
	UPDATE tank SET HP=HP-1 WHERE guildID = gID AND userID = targetID;
    SELECT 0;
    IF (SELECT HP FROM tank WHERE guildID = gID AND userID = targetID) = 0 THEN
		IF (SELECT COUNT(*) FROM tank WHERE guildID = gID AND userID = targetID AND HP>0) <= 1 THEN
			SELECT 2;
        ELSE
			SELECT 1;
        END IF;
        LEAVE this_proc;
    END IF;
    SELECT 0;
END$$

DROP PROCEDURE IF EXISTS sendAPTank$$
CREATE PROCEDURE sendAPTank(gID BIGINT UNSIGNED, uIDFrom BIGINT UNSIGNED, uIDTo BIGINT UNSIGNED)
this_proc:BEGIN
	DECLARE apmax INT UNSIGNED;
    DECLARE islocked BOOLEAN DEFAULT NULL;
    DECLARE dX, dY SMALLINT SIGNED DEFAULT NULL;
    DECLARE nap,health INT SIGNED DEFAULT NULL;
    IF uIDFrom = uIDTo THEN
		SELECT 11;
        LEAVE this_proc;
    END IF;
	SELECT maxAP,locked INTO apmax,islocked FROM board WHERE guildID = gID;
    IF islocked IS NULL THEN
		SELECT 10;
        LEAVE this_proc;
    END IF;
    IF NOT islocked THEN
		SELECT 15;
        LEAVE this_proc;
    END IF;
    SELECT X,Y,CAST(AP AS SIGNED)-1,HP INTO dX,dY,nap,health FROM tank WHERE guildID = gID AND userID = uIDFrom;
    IF dX IS NULL OR dY IS NULL OR nap IS NULL OR health IS NULL THEN
		SELECT 4;
        LEAVE this_proc;
    END IF;
    IF nap < 0 THEN
		SELECT 6;
        LEAVE this_proc;
    END IF;
    IF health <= 0 THEN
		SELECT 5;
        LEAVE this_proc;
    END IF;
    SET health = NULL;
    SELECT ABS(CAST(X AS SIGNED)-dX),ABS(CAST(Y AS SIGNED)-dY),HP INTO dX,dY,health FROM tank WHERE guildID = gID AND userID = uIDTo;
    IF health IS NULL THEN
		SELECT 14;
        LEAVE this_proc;
    END IF;
    IF health <= 0 THEN
		SELECT 12;
        LEAVE this_proc;
    END IF;
    IF dX>4 OR dY>4 THEN
		SELECT 13;
        LEAVE this_proc;
    END IF;
	UPDATE tank SET AP=nap WHERE guildID = gID AND userID = uIDFrom;
	UPDATE tank SET AP=LEAST(AP+1,apmax) WHERE guildID = gID AND userID = uIDTo;
    SELECT 0;
END$$