class UserDTO{
    constructor(user){
        this.username=user.username;
        this._id=user._id;
        this.name=user.name;
    }
}

module.exports=UserDTO;