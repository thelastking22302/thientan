package logger

import (
	"context"
	"io"
	"log"
	"os"
	"strings"
	"sync"

	"github.com/sirupsen/logrus"
)

type Logger interface {
	Infof(format string, v ...interface{})
	Debugf(format string, v ...interface{})
	Warnf(format string, v ...interface{})
	Errorf(format string, v ...interface{})
	Panicf(format string, v ...interface{})

	InfoWithContext(ctx context.Context, format string, v ...interface{})
	DebugWithContext(ctx context.Context, format string, v ...interface{})
	WarnWithContext(ctx context.Context, format string, v ...interface{})
	ErrorWithContext(ctx context.Context, format string, v ...interface{})
	PanicWithContext(ctx context.Context, format string, v ...interface{})

	WithField(field string, value interface{}) Logger
	WithFieldNoAdds(field string, value interface{}) Logger
	Close() error
}

// glog is a logger implementation
type glog struct {
	logger *logrus.Entry
	writer io.WriteCloser
}

var (
	instance *glog
	once     sync.Once
)

// GetLogger returns the singleton instance of the logger
func GetLogger() *glog {
	once.Do(func() {
		instance = New()
	})
	return instance
}

// New creates a new logger instance
func New() *glog {
	logger := logrus.New()
	logger.SetFormatter(getFormatter())
	logger.SetLevel(getLevel())
	out := getOutput()
	logger.SetOutput(out)

	return &glog{
		logger: logrus.NewEntry(logger),
		writer: out,
	}
}
func getFormatter() logrus.Formatter {
	timeFormat := os.Getenv("LOG_TIME_FORMAT")
	if timeFormat == "" {
		timeFormat = "2023-03-23 15:04:05"
	}

	if os.Getenv("LOG_FORMAT") == "text" {
		return &logrus.TextFormatter{
			TimestampFormat: timeFormat,
			FullTimestamp:   true,
		}
	}
	return &logrus.JSONFormatter{
		TimestampFormat: timeFormat,
	}
}

func getLevel() logrus.Level {
	lvl, err := logrus.ParseLevel(os.Getenv("LOG_LEVEL"))
	if err != nil {
		lvl = logrus.DebugLevel
	}
	return lvl
}

func getOutput() io.WriteCloser {
	out := os.Getenv("LOG_OUTPUT")
	if strings.HasPrefix(out, "file://") {
		name := out[len("file://"):]
		f, err := os.Create(name)
		if err != nil {
			log.Printf("log: failed to create log file: %s, err: %v\n", name, err)
			return os.Stdout
		}
		return f
	}
	return os.Stdout
}

// ADAPDER
type AdapterLogger struct {
	logger *logrus.Logger
}

func NewAdapterLogger(logger *logrus.Logger) *AdapterLogger {
	return &AdapterLogger{logger: logger}
}

func (l *glog) Infof(format string, v ...interface{}) {
	l.logger.Infof(format, v...)
}
func (l *glog) Debugf(format string, v ...interface{}) {
	l.logger.Debugf(format, v...)
}
func (l *glog) Warnf(format string, v ...interface{}) {
	l.logger.Warnf(format, v...)
}
func (l *glog) Errorf(format string, v ...interface{}) {
	l.logger.Errorf(format, v...)
}
func (l *glog) Panicf(format string, v ...interface{}) {
	l.logger.Panicf(format, v...)
}
func (l *glog) InfoWithContext(ctx context.Context, format string, v ...interface{}) {
	l.withContext(ctx).Infof(format, v...)
}
func (l *glog) DebugWithContext(ctx context.Context, format string, v ...interface{}) {
	l.withContext(ctx).Debugf(format, v...)
}
func (l *glog) WarnWithContext(ctx context.Context, format string, v ...interface{}) {
	l.withContext(ctx).Warnf(format, v...)
}
func (l *glog) ErrorWithContext(ctx context.Context, format string, v ...interface{}) {
	l.withContext(ctx).Errorf(format, v...)
}

func (l *glog) PanicWithContext(ctx context.Context, format string, v ...interface{}) {
	l.withContext(ctx).Panicf(format, v...)
}

func (l *glog) withContext(ctx context.Context) Logger {
	for key, value := range ctx.Value("logger").(map[string]string) {
		l.logger = l.logger.WithField(key, value)
	}
	return l
}

// DECORATOR
func (l *glog) WithField(field string, value interface{}) Logger {
	return &glog{logger: l.logger.WithField(field, value)}
}

// WithFieldNoAdds không thêm trường mới vào các trường hiện có
func (l *glog) WithFieldNoAdds(field string, value interface{}) Logger {
	return &glog{logger: l.logger.WithField(field, value)}
}

func (l *glog) Close() error {
	if l.writer != nil {
		return l.writer.Close()
	}
	return nil
}
