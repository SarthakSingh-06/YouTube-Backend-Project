export const asyncHandler = async (requestHandler) => {
    return () => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((error) => {
            next(error);
        });
    };
};
