import { Request, Response } from "express";
import catchAsync from "../../shared/CatchAsync";
import { config } from "../../config/env";
import AppResponse from "../../shared/AppResponse";
import AppError from "../../shared/AppError";
import status from "http-status";
import { paymentService } from "./payment.service";
import { stripe } from "../../config/stripe.config";

const handleStripeWebhokEventForMembership = catchAsync(
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;

    const webhookSecret = config.STRIPE_WEBHOOK_SECRET_KEY;

    if (!signature || !webhookSecret) {
      console.log("Misssing stripe webhok signature or secret.");

      throw new AppError(
        status.BAD_REQUEST,
        "Misssing stripe webhok signature or secret.",
        "Bad Request",
        [
          {
            field: "signature",
            message: "Misssing stripe webhok signature or secret.",
          },
        ],
      );
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret,
      );
    } catch (error) {
      console.error(error);
      throw new AppError(
        status.BAD_REQUEST,
        "Invalid stripe webhok signature.",
        "Bad Request",
        [
          {
            field: "signature",
            message: "Invalid stripe webhok signature.",
          },
        ],
      );
    }

    const result =
      await paymentService.handleStripeWebhokEventForMembership(event);

    AppResponse(res, {
      statusCode: status.OK,
      success: true,
      message: "Stripe webhok event handled successfully.",
      data: result,
    });
  },
);

export const paymentController = {
  handleStripeWebhokEventForMembership,
};
