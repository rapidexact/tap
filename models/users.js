module.exports = (sequelize, DataTypes) => {
    return sequelize.define("users", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_vk : DataTypes.INTEGER,
        registeredAt : DataTypes.DATE,
        played_games_count : DataTypes.INTEGER,
        user_invited: DataTypes.INTEGER,
    })
};
