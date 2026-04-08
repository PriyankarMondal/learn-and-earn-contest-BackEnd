export const checkrole= (req,res,next)=>{
 
        if(!req.user || req.user.role!=="Admin")
        {
            return res.status(401).json({
                message:"you should be admin"
            })
        }
        next()
}