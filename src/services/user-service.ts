import NodeCache from "node-cache";
import User from "../models/User";


class UserService {
  cash = new NodeCache({ stdTTL: 60, checkperiod: 60 * 60 }); // 1 minutes cache TTL
  async signUp(
    userId: number,
    firstName: string,
    lastName: string | undefined,
    username: string | undefined,
    languageCode: string
  ) {
    const isExist = await User.findOne({ userId });
    if (isExist) {
      this.cash.set(userId, isExist.toObject());
      return isExist.toObject();
    }
    return await User.create({
      userId,
      firstName,
      lastName,
      username,
      languageCode,
      registrationDate: Date.now(),
    }).then((user) => {
      this.cash.set(userId, user.toObject());
      return user.toObject();
    });
  }
  async getUser(userId: number) {
    const user: any = this.cash.get(userId);
    if (user) return user;
    return await User.findOne({ userId });
  }



 
 
}

export default module.exports = new UserService();
