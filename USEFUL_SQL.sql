/*Commands I need to note go here*/
SELECT Users.UUID,Username,Action,Timestamp,INET6_NTOA(IPAddress) FROM APILog INNER JOIN Users ON Users.UUID=APILog.UUID ORDER BY Timestamp;
