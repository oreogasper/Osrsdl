<?php
// Get the JSON string from the request body
$jsonString = file_get_contents('php://input');

// Write the JSON string back to the boss.json file
file_put_contents('boss.json', $jsonString);
?>