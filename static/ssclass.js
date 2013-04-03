var SSClass = (function () {
    function SSClass(name, deptNum, classNum) {
        this.name = name;
        this.deptNum = deptNum;
        this.classNum = classNum;
    }
    SSClass.prototype.equals = function (cls) {
        if(this.deptNum === cls.deptNum && this.classNum === cls.classNum) {
            return true;
        } else {
            return false;
        }
    };
    return SSClass;
})();
