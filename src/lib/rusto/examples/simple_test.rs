// Example Rust test file for AST transformation

#[test]
fn test_addition() {
    assert_eq!(2 + 2, 4);
}

#[test]
fn test_subtraction() {
    assert_eq!(5 - 3, 2);
}

#[tokio::test]
async fn test_async_operation() {
    let result = async { 42 }.await;
    assert_eq!(result, 42);
}

// Non-test function (should not be transformed)
fn helper_function() -> i32 {
    42
}
