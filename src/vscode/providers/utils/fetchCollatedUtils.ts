export async function fetchCollatedInputFiles(): Promise<any> {
    const response = await fetch('http://localhost:3000/~/collated-inputfiles');
    return response.json();
}

export async function fetchCollatedTestResults(): Promise<any> {
    const response = await fetch('http://localhost:3000/~/collated-testresults');
    return response.json();
}
