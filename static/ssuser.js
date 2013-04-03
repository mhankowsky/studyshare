var SSUser = (function () {
    function SSUser(username, facebook, currentCheckin) {
        this.username = username;
        this.facebook = facebook;
        this.currentCheckin = currentCheckin;
    }
    SSUser.prototype.equals = function (user) {
        if(this.facebook == user.facebook) {
            return true;
        } else {
            return false;
        }
    };
    SSUser.prototype.addFriend = function (user) {
        this.friends.push(user);
    };
    SSUser.prototype.deleteFriend = function (user) {
        for(var i = 0; i < this.friends.length; i++) {
            if(user.equals(this.friends[i])) {
                this.friends.splice(i, 1);
            }
        }
    };
    SSUser.prototype.addClass = function (newClass) {
        this.classes.push(newClass);
    };
    SSUser.prototype.deleteClass = function (cls) {
        for(var i = 0; i < this.classes.length; i++) {
            if(cls.equals(this.classes[i])) {
                this.classes.splice(i, 1);
            }
        }
    };
    SSUser.prototype.ownClass = function (newClass) {
        this.ownedClasses.push(newClass);
    };
    SSUser.prototype.unownClass = function (cls) {
        for(var i = 0; i < this.ownedClasses.length; i++) {
            if(cls.equals(this.ownedClasses[i])) {
                this.ownedClasses.splice(i, 1);
            }
        }
    };
    return SSUser;
})();
