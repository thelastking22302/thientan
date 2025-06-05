package users_repo

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"
	"thelastking-blogger.com/src/controller/common"
	"thelastking-blogger.com/src/module"
	"thelastking-blogger.com/src/module/req_users"
	"thelastking-blogger.com/src/security"
)

type sql struct {
	db *gorm.DB
}

func NewSql(db *gorm.DB) *sql {
	return &sql{db: db}
}

func (s *sql) CreateUsers(ctx context.Context, data *module.Users) error {
	if err := s.db.Table("users").FirstOrCreate(&data, &module.Users{Account: data.Account}).Error; err != nil {
		return err
	}
	return nil
}

func (s *sql) ProfileUsers(ctx context.Context, idData map[string]any) (*module.Users, error) {
	var data module.Users
	if err := s.db.Table("users").Where(idData).First(&data).Error; err != nil {
		return nil, err
	}
	return &data, nil
}

func (s *sql) UpdatedUsers(ctx context.Context, updateData *req_users.UpdateUsers, idData map[string]any) error {
	if err := s.db.Table("users").Where(idData).Updates(updateData).Error; err != nil {
		return err
	}
	return nil
}

func (s *sql) DeleteUsers(ctx context.Context, idData map[string]any) error {
	if err := s.db.Table("users").Where(idData).Delete(&module.Users{}).Error; err != nil {
		return err
	}
	return nil
}

func (s *sql) SignIn(ctx context.Context, data *req_users.RequestSignIn) (*module.Users, error) {
	var dataUser module.Users
	if err := s.db.Table("users").
		Where("account = ?", data.Account).
		First(&dataUser).Error; err != nil {
		return nil, err
	}
	return &dataUser, nil
}

func (s *sql) ChanrgePwd(ctx context.Context, idData map[string]any, chanrge *req_users.RequestUpdatePassword) error {
	var dataUser module.Users
	if err := s.db.Table("users").Where("user_id = ?", idData["user_id"]).First(&dataUser).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("old password is incorrect")
		}
		return err
	}

	if !security.ComparePasswords(dataUser.Password_user, []byte(chanrge.OldPassword)) {
		return errors.New("old password is incorrect")
	}

	hashPwd := security.HashAndSalt([]byte(chanrge.NewPassword))
	if err := s.db.Table("users").
		Where("user_id = ?", idData["user_id"]).
		Update("password_user", hashPwd).Error; err != nil {
		return err
	}
	return nil
}

func (s *sql) ForgotPwd(ctx context.Context, upPwd *req_users.ForgorPwd) error {
	var user module.Users
	if err := s.db.Table("users").
		Where("account = ?", upPwd.Account).
		First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("account does not exist")
		}
		return err
	}
	// Nếu tìm thấy, cập nhật mật khẩu
	if err := s.db.Table("users").
		Where("account = ?", upPwd.Account).
		Update("password_user", upPwd.NewPassword).Error; err != nil {
		return err
	}

	return nil
}

func (s *sql) ListUser(ctx context.Context, pagging *common.Paggings) ([]module.Users, error) {
	var data []module.Users
	if err := s.db.Table("users").Count(&pagging.Total).Error; err != nil {
		return nil, err
	}
	if err := s.db.Table("users").
		Order("user_id desc").
		Offset((pagging.Page - 1) * pagging.Limit).Limit(pagging.Limit).Find(&data).Error; err != nil {
		return nil, err
	}
	return data, nil
}

func (s *sql) UpdatedUsersByID(ctx context.Context, updateData *req_users.UpdateUsersByID, idData map[string]any) error {
	if err := s.db.Table("users").Where(idData).Updates(updateData).Error; err != nil {
		return err
	}
	return nil
}
