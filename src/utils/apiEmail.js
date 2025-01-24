class ApiEmail {
    constructor(
        receipentEmail, 
        name, 
        title, 
        body, 
        route, 
        randomKey 
    ){
        this.receipentEmail = receipentEmail,
        this.name = name,
        this.title = title,
        this.body = body,
        this.route = route, 
        this.randomKey = randomKey
    }
}

export default ApiEmail