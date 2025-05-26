export async function getPOSTAPIRequestBody(name: string, job: string) {

        const apiRequest: User = {
            name: name,
            job: job
        }
        return apiRequest;
}
