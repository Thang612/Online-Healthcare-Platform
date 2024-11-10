import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'mysql',
    host: 'localhost',
    port: 33061,
    username: 'root',
    password: 'root',
    database: 'medical',
    entities: [User],
    synchronize: true,
  }),UserModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
