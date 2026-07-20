<?php
header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get POST data
    $data = json_decode(file_get_contents("php://input"), true);
    
    $name = strip_tags(trim($data["name"]));
    $email = filter_var(trim($data["email"]), FILTER_SANITIZE_EMAIL);
    $subject = strip_tags(trim($data["subject"]));
    $message = trim($data["message"]);

    // Validation
    if (empty($name) || empty($message) || empty($subject) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Please complete all fields correctly."]);
        exit;
    }

    $recipient = "lanceoboza17@gmail.com";
    $email_subject = "Portfolio Contact: $subject";
    
    $email_content = "Name: $name\n";
    $email_content .= "Email: $email\n\n";
    $email_content .= "Message:\n$message\n";
    
    $email_headers = "From: $email\r\n";
    $email_headers .= "Reply-To: $email\r\n";

    // Send email
    if (mail($recipient, $email_subject, $email_content, $email_headers)) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Message sent successfully!"]);
    } else {
        http_response_code(500);
        $error = error_get_last();
        $error_msg = $error ? $error['message'] : "Unknown error";
        echo json_encode(["status" => "error", "message" => "Failed to send message via PHP mail(). Error: " . $error_msg]);
    }
} else {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>
