import { isValidObjectId, Types as mongooseTypes } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { API_Error } from "../utils/api-error.js";
import { API_Response } from "../utils/api-response.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!isValidObjectId(channelId))
        throw new API_Error(400, `${channelId} is not a valid mongodb id`);

    const existingSubscription = await Subscription.findOneAndDelete({
        channel: new mongooseTypes.ObjectId(channelId),
        subscriber: new mongooseTypes.ObjectId(req.user?._id)
    }).select("_id");
    if (!existingSubscription) {
        // subscribe the channel if not subscribed
        const newSubscription = await Subscription.insertOne({
            channel: new mongooseTypes.ObjectId(channelId),
            subscriber: new mongooseTypes.ObjectId(req.user?._id)
        });

        // return channel subcribed response
        return res
            .status(200)
            .json(
                new API_Response(200, newSubscription, "Subscribed")
            );
    }

    // return channel unsubcribed response
    return res
        .status(200)
        .json(
            new API_Response(200, existingSubscription, "Unsubscribed")
        );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
};
