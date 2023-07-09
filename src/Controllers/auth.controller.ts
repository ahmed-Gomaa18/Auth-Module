import { signUp,sendMailConfirmation, signIn, confrimEmailService, resendConfrimEmailService, signOut , generateResetPasswordLink, resetPassword} from "../Services/auth.service";
import { NextFunction, Request, Response } from "express";

import Logger from '../Config/logger';

import passport from "../Config/passport";

import AppError from '../Utils/appErorr';
import { sendEmail } from "../Utils/sendEmailHelper";

export async function Register(req: Request, res: Response) {
    try {

        const {firstName, lastName, email, password} = req.body;

        // Call Service
        const result = await signUp(firstName, lastName, email, password);
        if (result.isSuccess) {
            // Send Mail
            sendMailConfirmation(result.user._id, result.user.email, req);
            // Logging
            Logger.info(`@Method:(${req.route.stack[0].method}) @Endpoint:(${req.route.path}) @FunName:(${req.route.stack[0].name}) - This User id: (${result.user._id}) email: (${result.user.email}) Created Successfully.`)

            return res.status(result.status).json({ "message": result.message, "user": result.user });
        }
        else {

            return res.status(result.status).json({ "message": result.message });

        }

    }
    catch (error) {
        if (error.keyValue?.email) {
            res.status(409).json({ message: "This Email Already Exist" });

        } else {

            res.status(500).json({ message: "catch error : " + error.message });
        }
    }

}

export async function Login(req: Request, res: Response) {
    const { email, password, rememberMe } = req.body;
    try {
        // call service
        const result = await signIn(email, password, rememberMe);
        if (result.isSuccess) {

            Logger.info(`@Method:(${req.route.stack[0].method}) @Endpoint:(${req.route.path}) @FunName:(${req.route.stack[0].name}) - This User id: (${result.user._id}) email: (${result.user.email}) LogIn Successfully.`)

            return res.status(result.status).json({ "message": result.message, "user": result.user, "token": result.Token });
        }
        else {

            Logger.error(`@Method:(${req.route.stack[0].method}) @Endpoint:(${req.route.path}) @FunName:(${req.route.stack[0].name}) - ${result.message}`)

            return res.status(result.status).json({ "message": result.message });

        }

    }
    catch (error) {
        console.log(error);
        // log Error
        Logger.error(`@Method:(${req.route.stack[0].method}) @Endpoint:(${req.route.path}) @FunName:(${req.route.stack[0].name}) - Error Occurred While This User Try to LogIn email:(${email}) Error: ${error.message}. `)
        res.status(500).json({ message: "Catch Error" + error.message });
    }
}

export async function confrimEmail(req: Request, res: Response) {
    try {

        const { token } = req.params;
        const result = await confrimEmailService(token);
        if (result.isSuccess) {
            // Render Front Page

            //Log To Success
            Logger.info(`@Method:(${req.route.stack[0].method}) @Endpoint:(${req.route.path}) @FunName:(${req.route.stack[0].name}) - This User id: (${result.user._id}) Confirmed Email Successfully.`)
            return res.status(result.status).json({ "message": result.message });
        }
        else {

            Logger.error(`@Method:(${req.route.stack[0].method}) @Endpoint:(${req.route.path}) @FunName:(${req.route.stack[0].name}) - This User id: (${result.user._id}) ${result.message}`);
            return res.status(result.status).json({ "message": result.message });

        }
    }
    catch (error) {

        //console.log(error);
        if (error.message == "jwt expired") {
            Logger.error(`@Method:(${req.route.stack[0].method}) @Endpoint:(${req.route.path}) @FunName:(${req.route.stack[0].name}) - Your Token is Expired`);
            res.status(500).json({ message: "Your Token is Expired" })
        } else {
            Logger.error(`@Method:(${req.route.stack[0].method}) @Endpoint:(${req.route.path}) @FunName:(${req.route.stack[0].name}) - ${error}`);
            res.status(500).json({ message: "Catch Error", error })
        }
    }
}

export async function resendConfrimEmail(req: Request, res: Response) {
    try {

        const { userId } = req.params;
        const result = await resendConfrimEmailService(req, userId);
        if (result.isSuccess) {

            //Log To Success
            Logger.info(`@Method:(${req.route.stack[0].method}) @Endpoint:(${req.route.path}) @FunName:(${req.route.stack[0].name}) - This User id: (${userId}) Resend Confirmed Email Successfully.`)
            return res.status(result.status).json({ "message": result.message });
        }
        else {

            Logger.error(`@Method:(${req.route.stack[0].method}) @Endpoint:(${req.route.path}) @FunName:(${req.route.stack[0].name}) - This User id: (${userId}) ${result.message}`);
            return res.status(result.status).json({ "message": result.message });

        }
    }
    catch (error) {
        // log Error
        Logger.error(`@Method:(${req.route.stack[0].method}) @Endpoint:(${req.route.path}) @FunName:(${req.route.stack[0].name}) - Error Occurred While Resend Confirmed Email To This User (${req.params.userId}) : ${error.message}. `)
        res.status(500).json({ message: "Catch Error" + error.message })
    }
}

export async function Logout(req: Request, res: Response) {
    const userId = req.user.userId;
    try {
        // call service
        const result = await signOut(userId);
        if (result.isSuccess) {

            Logger.info(`@Method:(${req.route.stack[0].method}) @Endpoint:(${req.route.path}) @FunName:(${req.route.stack[0].name}) - This User id: (${result.user._id}) email: (${result.user.email}) Logout Successfully.`)

            return res.status(result.status).json({ "message": result.message });
        }
        else {

            Logger.error(`@Method:(${req.route.stack[0].method}) @Endpoint:(${req.route.path}) @FunName:(${req.route.stack[0].name}) - ${result.message}`)

            return res.status(result.status).json({ "message": result.message });

        }

    }
    catch (error) {
        console.log(error);
        // log Error
        Logger.error(`@Method:(${req.route.stack[0].method}) @Endpoint:(${req.route.path}) @FunName:(${req.route.stack[0].name}) - Error Occurred While This User Try to LogIn id:(${userId}) Error: ${error.message}. `)
        res.status(500).json({ message: "Catch Error" + error.message });
    }
}

// Auth By Google
export function httpLogin(req: Request, res: Response, next: NextFunction) {
    passport.authenticate("google", {
        scope: ["email", "profile"],
    })(req, res, next);
}

export function httpCallbackURL(req: Request, res: Response, next: NextFunction) {
    passport.authenticate("google", { session: false }, (err, token, user) => {
        if (err) {
            return next(err);
        }

        // res.setHeader('Authorization', `Bearer ${token}`);
        // res.redirect("https://www.google.com.eg/?hl=ar");

        res.status(201).json({ message: 'User Auth By Google Successfully.', token, user: user });

    })(req, res, next);
}


export async function requestResetPassword(req: Request, res: Response, next: NextFunction){
    try {
        const { email } = req.body;
        const result = await generateResetPasswordLink(email);

        if(result.isSuccess){

            // Send Mail
            const message = `<h1>Welcome👋</h1>
            <a href =${result.link}>
            Please Follow This Link To Reset Your Password.
            </a> `;

            sendEmail(email, "Password Reset Request", message, result.user_id );

            // Loging
            Logger.info(`@Method:(${req.route.stack[0].method}) @Endpoint:(${req.route.path}) @FunName:(${req.route.stack[0].name}) - This User id: (${result.user_id}) email: (${email}) Want To Reset Password.`)
            

            return res.status(result.status).json({message: result.message});

        }else{

            Logger.error(`@Method:(${req.route.stack[0].method}) @Endpoint:(${req.route.path}) @FunName:(${req.route.stack[0].name}) - This User email: (${email}) ${result.message}`);
            return res.status(result.status).json({message: result.message});
        }

    }
    catch (error) {
        // console.log(error);
        return next(new AppError(error.message, 500))
    }
}

export async function resetPasswordController(req: Request, res: Response, next: NextFunction){
    try {
        const { userId, token, password } = req.body;
        const result = await resetPassword(userId, token, password);
        if(result.isSuccess){
            
            // Send Mail
            const message = `<h1>Welcome Back👋</h1>
            <h3>
            Your password has been changed successfully.
            </h3> `;
            sendEmail(result.user.email, "Password Reset Request", message, result.user._id );


            // Loging
            Logger.info(`@Method:(${req.route.stack[0].method}) @Endpoint:(${req.route.path}) @FunName:(${req.route.stack[0].name}) - This User id: (${result.user._id}) email: (${result.user.email}) Reset Password Successfully.`)


            return res.status(result.status).json({message: result.message});

        }
        else
        {
            // Loging Erorr
            Logger.error(`@Method:(${req.route.stack[0].method}) @Endpoint:(${req.route.path}) @FunName:(${req.route.stack[0].name}) - This User id: (${userId}) ${result.message}`);
            
            return res.status(result.status).json({message: result.message});
            
        }

    } catch (error) {
        return next(new AppError(error.message, 500))
    }

}