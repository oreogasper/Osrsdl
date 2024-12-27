<?php
// Get the JSON string from the request body
$jsonString = file_get_contents('php://input');

echo 'Request Method: ' . $_SERVER['REQUEST_METHOD'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo 'Method Not Allowed';
    exit;
}

// Write the JSON string back to the boss.json file
file_put_contents('boss.json', $jsonString);
file_put_contents('debug.log', json_encode($_POST, JSON_PRETTY_PRINT));
?>
