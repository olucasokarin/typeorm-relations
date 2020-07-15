import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Customer from '../infra/typeorm/entities/Customer';
import ICustomersRepository from '../repositories/ICustomersRepository';

interface IRequest {
  name: string;
  email: string;
}

@injectable()
class CreateCustomerService {
  constructor(
    @inject('CustomerRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ name, email }: IRequest): Promise<Customer> {
    // TODO
    const findCustomer = await this.customersRepository.findByEmail(email);

    if (findCustomer) throw new AppError('email ja cadastrado');

    const response = this.customersRepository.create({ email, name });

    return response;
  }
}

export default CreateCustomerService;
