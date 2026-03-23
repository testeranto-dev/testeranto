export async function fetchCollatedDocumentation(): Promise<any> {
    const response = await fetch('http://localhost:3000/~/collated-documentation');
    return response.json();
}
