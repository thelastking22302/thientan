package users_service

import (
	"context"
	"errors"

	"thelastking-blogger.com/src/config/logger"
	"thelastking-blogger.com/src/controller/common"
	"thelastking-blogger.com/src/module"
	"thelastking-blogger.com/src/module/req_users"
)

type UsersResponse interface {
	CreateUsers(ctx context.Context, data *module.Users) error
	ProfileUsers(ctx context.Context, idData map[string]any) (*module.Users, error)
	UpdatedUsers(ctx context.Context, updateData *req_users.UpdateUsers, idData map[string]any) error
	DeleteUsers(ctx context.Context, idData map[string]any) error
	ChanrgePwd(ctx context.Context, idData map[string]any, chanrge *req_users.RequestUpdatePassword) error
	SignIn(ctx context.Context, data *req_users.RequestSignIn) (*module.Users, error)
	ForgotPwd(ctx context.Context, upPwd *req_users.ForgorPwd) error
	ListUser(ctx context.Context, pagging *common.Paggings) ([]module.Users, error)
	UpdatedUsersByID(ctx context.Context, updateData *req_users.UpdateUsersByID, idData map[string]any) error
}

type usersController struct {
	u       UsersResponse
	loggers logger.Logger
}

func NewUserController(u UsersResponse) *usersController {
	return &usersController{
		u:       u,
		loggers: logger.GetLogger(),
	}
}

func (res *usersController) NewCreateUsers(ctx context.Context, data *module.Users) error {
	if err := res.u.CreateUsers(ctx, data); err != nil {
		res.loggers.Errorf("Create Failds user: %v", err)
		return errors.New("create failled bussiness")
	}
	res.loggers.Infof("Create user successfully: %+v", data)
	return nil
}

func (res *usersController) NewProfileUsers(ctx context.Context, idData string) (*module.Users, error) {
	dataUser, err := res.u.ProfileUsers(ctx, map[string]any{"user_id": idData})
	if err != nil {
		res.loggers.Errorf("Faild get user with ID %s: %v", idData, err)
		return nil, errors.New("faild get user")
	}
	res.loggers.Infof("Success get user: %+v", dataUser)
	return dataUser, nil
}

func (res *usersController) NewUpdatedUsers(ctx context.Context, updateData *req_users.UpdateUsers, idData string) error {
	if err := res.u.UpdatedUsers(ctx, updateData, map[string]any{"user_id": idData}); err != nil {
		res.loggers.Errorf("Faild update user with ID %s: %v", idData, err)
		return errors.New("faild update user")
	}
	res.loggers.Infof("Update successfully")
	return nil
}

func (res *usersController) NewDeleteUsers(ctx context.Context, idData string) error {
	if err := res.u.DeleteUsers(ctx, map[string]any{"user_id": idData}); err != nil {
		res.loggers.Errorf("Faild delete user with ID %s: %v", idData, err)
		return errors.New("faild delete user")
	}
	res.loggers.Infof("Delete user successfully")
	return nil
}

func (res *usersController) NewSignIn(ctx context.Context, data *req_users.RequestSignIn) (*module.Users, error) {
	dataUser, err := res.u.SignIn(ctx, data)
	if err != nil {
		res.loggers.Errorf("Sign in Failds: %v", err)
		return nil, errors.New("signin failed bussiness")
	}
	res.loggers.Infof("Signin successfully: %+v", dataUser)
	return dataUser, nil
}

func (res *usersController) NewChanrgePwd(ctx context.Context, idData string, chanrge *req_users.RequestUpdatePassword) error {
	if err := res.u.ChanrgePwd(ctx, map[string]any{"user_id": idData}, chanrge); err != nil {
		res.loggers.Errorf("Chanrge password Failds: %v", err)
		return errors.New("Chanrge password failed bussiness")
	}
	res.loggers.Infof("Chanrge password successfully")
	return nil
}

func (res *usersController) NewForgotPwd(ctx context.Context, upPwd *req_users.ForgorPwd) error {
	if err := res.u.ForgotPwd(ctx, upPwd); err != nil {
		res.loggers.Errorf("Forgot password Failds: %v", err)
		return errors.New("Forgot password failed bussiness")
	}
	res.loggers.Infof("Forgot password successfully")
	return nil
}

func (res *usersController) NewListUser(ctx context.Context, pagging *common.Paggings) ([]module.Users, error) {
	listData, err := res.u.ListUser(ctx, pagging)
	if err != nil {
		res.loggers.Errorf("Failed to get users list: %v", err)
		return nil, err
	}
	res.loggers.Infof("Retrieved users list: %d users found", len(listData))
	return listData, nil
}

func (res *usersController) NewUpdatedUsersByID(ctx context.Context, updateData *req_users.UpdateUsersByID, idData string) error {
	if err := res.u.UpdatedUsersByID(ctx, updateData, map[string]any{"user_id": idData}); err != nil {
		res.loggers.Errorf("Faild update user with ID %s: %v", idData, err)
		return errors.New("faild update user")
	}
	res.loggers.Infof("Update successfully")
	return nil
}
