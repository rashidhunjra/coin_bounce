class commentDto {
  constructor(comment) {
    this._id = comment._id;
    this.createdAt = comment.createdAt;
    this.content = comment.content;
    this.autherUsername = comment.auther.username;
  }
}

module.exports = commentDto;
