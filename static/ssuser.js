var SSUser = (function () {
    function SSUser(username, facebook, currentCheckin) {
        this.username = username;
        this.facebook = facebook;
        this.currentCheckin = currentCheckin;
    }
    SSUser.prototype.equals = function (user) {
        if(this.facebook === user.facebook) {
            return true;
        } else {
            return false;
        }
    };
    SSUser.prototype.addFriend = function (user) {
        this.friends.forEach(function (x) {
            if(user.equals(x)) {
                return false;
            }
        });
        this.friends.push(user);
        return true;
    };
    SSUser.prototype.deleteFriend = function (user) {
        for(var i = 0; i < this.friends.length; i++) {
            if(user.equals(this.friends[i])) {
                return this.friends.splice(i, 1);
            }
        }
        return null;
    };
    SSUser.prototype.addClass = function (newClass) {
        this.classes.forEach(function (x) {
            if(newClass.equals(x)) {
                return false;
            }
        });
        this.classes.push(newClass);
        return true;
    };
    SSUser.prototype.deleteClass = function (cls) {
        for(var i = 0; i < this.classes.length; i++) {
            if(cls.equals(this.classes[i])) {
                return this.classes.splice(i, 1);
            }
        }
        return null;
    };
    SSUser.prototype.ownClass = function (newClass) {
        this.ownedClasses.forEach(function (x) {
            if(newClass.equals(x)) {
                return false;
            }
        });
        this.ownedClasses.push(newClass);
        return true;
    };
    SSUser.prototype.unownClass = function (cls) {
        for(var i = 0; i < this.ownedClasses.length; i++) {
            if(cls.equals(this.ownedClasses[i])) {
                return this.ownedClasses.splice(i, 1);
            }
        }
        return null;
    };
    return SSUser;
})();
