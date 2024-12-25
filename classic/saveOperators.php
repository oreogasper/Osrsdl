<?php
// Set the content type to JSON
header('Content-Type: application/json');

try {
    // Get the JSON string from the request body
    $jsonString = file_get_contents('php://input');

    // Validate JSON
    if (json_decode($jsonString) === null && json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400); // Bad Request
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }

    // Define the file path for boss.json
    $filePath = __DIR__ . '/boss.json';

    // Check if the file is writable
    if (!is_writable($filePath)) {
        http_response_code(500); // Internal Server Error
        echo json_encode(['error' => 'boss.json is not writable']);
        exit;
    }

    // Write the JSON string back to the boss.json file
    if (file_put_contents($filePath, $jsonString) === false) {
        http_response_code(500); // Internal Server Error
        echo json_encode(['error' => 'Failed to write to boss.json']);
        exit;
    }

    // Success response
    http_response_code(200); // OK
    echo json_encode(['success' => 'Boss data saved successfully']);

} catch (Exception $e) {
    // Catch any unexpected errors
    http_response_code(500); // Internal Server Error
    echo json_encode(['error' => 'An unexpected error occurred', 'details' => $e->getMessage()]);
}
?>
