module.exports = (sequelize, DataTypes) => {
    return sequelize.define("users_vk", {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        first_name: DataTypes.STRING,
        last_name: DataTypes.STRING,
        nickname: DataTypes.STRING,
        domain: DataTypes.STRING,
        sex: DataTypes.STRING,
        bdate: DataTypes.STRING,
        city: DataTypes.STRING,
        country: DataTypes.STRING,
        has_mobile: DataTypes.STRING,
        photo: DataTypes.STRING,
        friends_count: DataTypes.INTEGER,
    })
};
